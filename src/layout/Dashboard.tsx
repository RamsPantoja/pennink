import {
	ArrowDownTrayIcon,
	CircleStackIcon,
	DocumentPlusIcon,
	ListBulletIcon,
	MagnifyingGlassIcon,
	SquaresPlusIcon,
} from "@heroicons/react/24/outline";
import type { Session } from "next-auth";
import { useRouter } from "next/router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Feedback } from "~/components/Feedback";
import { AppSidebar } from "~/components/Sidebar";
import { DocumentLoader } from "~/components/Workspace/DocumentLoader";
import { useWorkspaceStore } from "~/components/Workspace/useWorkspaceStore";
import { Button } from "~/components/common/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { env } from "~/env";
import useUploadObjectToStorage from "~/hooks/useUploadObjectToStorage";
import { fileSizeRule } from "~/lib/utils";
import { api } from "~/utils/api";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import Image from "next/image";
import PomodoroTimer from "~/components/Pomodoro";
import { FormLoader } from "~/components/Workspace/FormLoader";
import { CommandIcon } from "lucide-react";

type DashboardProps = {
	session: Session;
	children: ReactNode;
};

const Dashboard = ({ children, session }: DashboardProps) => {
	const router = useRouter();
	const utils = api.useUtils();
	const [openDocumentLoader, setOpenDocumentLoader] = useState<boolean>(false);
	const { workspaceId } = router.query;
	const { loading: uploadingFile, onUploadFile } = useUploadObjectToStorage();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { setDocument } = useWorkspaceStore();
	const [isReadingPDF, setIsReadingPDF] = useState<boolean>(false);
	const [openFormLoader, setOpenFormLoader] = useState<boolean>(false);

	const { mutate: createFile, isPending: createFileIsPending } =
		api.workspace.createFile.useMutation({
			onSuccess: async (data) => {
				toast("You can now ask to your document!");
				setDocument({
					id: data.id,
					filename: data.filename,
					type: data.type,
					src: `${env.NEXT_PUBLIC_BUCKET_PUBLIC_DOMAIN}/${data.key}`,
				});

				await utils.user.statics.invalidate();
				await utils.workspace.filesByUserId.invalidate();
			},
			onError: (error) => {
				toast(error.message);
			},
		});

	const { mutate: initStaticsMutation } = api.user.initStatics.useMutation();

	useEffect(() => {
		initStaticsMutation();
	}, []);

	const {
		mutateAsync: triggerUploadFilesRuleMutation,
		isPending: triggerUploadFilesRuleIsPending,
	} = api.workspace.triggerUploadFilesRule.useMutation({
		onError: (error) => {
			toast(error.message);
		},
	});

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];

		if (!selectedFile) return;

		const ruleRes = fileSizeRule({
			file: selectedFile,
			session,
		});

		if (!ruleRes.isValid) {
			return;
		}

		if (selectedFile.type !== "application/pdf") {
			toast("Invalid file type");
			return;
		}

		setIsReadingPDF(true);
		const loader = new WebPDFLoader(selectedFile);
		const docs = await loader.load();
		setIsReadingPDF(false);

		if (docs.length === 0) {
			toast("No pages found in the PDF");
			return;
		}

		if (docs.length > 50) {
			toast(`Too many pages in the PDF: ${docs.length} pages (max 50)`);
			return;
		}

		try {
			await triggerUploadFilesRuleMutation();

			if (typeof workspaceId !== "string") {
				toast("Invalid workspace ID");
				return;
			}

			toast("Your file is processing, wait a moment, please...");

			const res = await onUploadFile({
				file: selectedFile,
				path: `workspace/documents/${session.user.id}`,
			});

			if (!res) {
				return;
			}

			createFile({
				type: selectedFile.type,
				filename: selectedFile.name,
				key: res.key,
				workspaceId,
			});
		} catch (e) {
			console.error(e);
		}
	};

	const onNewWorkspace = async () => {
		await router.push("/");
		setDocument(null);
	};

	return (
		<SidebarProvider>
			<Input
				ref={fileInputRef}
				type="file"
				accept="application/pdf"
				className="hidden"
				onChange={handleFileChange}
				data-testid="file-input"
			/>
			<AppSidebar session={session} />
			<FormLoader
				onSelect={(form) => {
					console.log(form);
					setOpenFormLoader(false);
				}}
				open={openFormLoader}
				onOpenChange={setOpenFormLoader}
			/>
			<DocumentLoader
				onSelect={(doc) => {
					setDocument(doc);
					setOpenDocumentLoader(false);
					localStorage.setItem(
						"pennink-doc",
						JSON.stringify({
							...doc,
							workspaceId,
						}),
					);
				}}
				open={openDocumentLoader}
				onOpenChange={setOpenDocumentLoader}
			/>
			<main className="bg-mochaBase flex h-screen w-full flex-col overflow-hidden">
				<div className="flex p-2 gap-4 items-center justify-between w-full border-b border-mochaMauve">
					<div className="flex items-center gap-2">
						<SidebarTrigger className="min-w-8 h-8">
							<span>Toggle</span>
						</SidebarTrigger>
						<p className="text-xs text-mochaSubText">Ctrl-B</p>
					</div>
					<div className="flex items-center gap-2">
						{/*{router.asPath !== "/" && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => {
											setOpenFormLoader(true);
										}}
									>
										<ListBulletIcon className="min-w-5 w-5 h-5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Search from your forms</TooltipContent>
							</Tooltip>
						)}*/}
						{router.asPath !== "/" && (
							<DropdownMenu>
								<Tooltip>
									<TooltipTrigger asChild>
										<DropdownMenuTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												isPending={
													uploadingFile ||
													createFileIsPending ||
													triggerUploadFilesRuleIsPending ||
													isReadingPDF
												}
											>
												<CircleStackIcon className="min-w-5 w-5 h-5" />
											</Button>
										</DropdownMenuTrigger>
									</TooltipTrigger>
									<TooltipContent>Search from your sources</TooltipContent>
								</Tooltip>
								<DropdownMenuContent
									side="right"
									onCloseAutoFocus={(e) => {
										e.preventDefault();
										e.stopPropagation();
									}}
								>
									<DropdownMenuItem
										onClick={() => fileInputRef.current?.click()}
										className="flex gap-2"
									>
										<ArrowDownTrayIcon className="min-w-5 w-5 h-5" />
										Import PDF
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => {
											setOpenDocumentLoader(true);
										}}
										className="flex gap-2"
									>
										<MagnifyingGlassIcon className="min-w-5 w-5 h-5" />
										Search sources
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}

						{router.asPath !== "/" && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button onClick={onNewWorkspace} variant="ghost" size="icon">
										<SquaresPlusIcon className="min-w-5 w-5 h-5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>New workspace</TooltipContent>
							</Tooltip>
						)}
						{router.asPath !== "/" && <PomodoroTimer />}
						<Feedback session={session} />
					</div>

					{/* <div className="flex items-center gap-4">
						{!session && (
							<Link
								className="text-mochaCrust font-bold bg-mochaMauve pl-4 pr-4 pt-2 pb-2 rounded-full"
								href="/sign-in"
							>
								Sign in
							</Link>
						)}
						{session && (
							<Tooltip>
								<TooltipTrigger asChild>
									<span>
										<Notifications session={session} />
									</span>
								</TooltipTrigger>
								<TooltipContent>Notifications</TooltipContent>
							</Tooltip>
						)}
					</div> */}
				</div>
				<div className="flex w-full h-full gap-2 overflow-hidden">
					{children}
				</div>
			</main>
		</SidebarProvider>
	);
};

export default Dashboard;
