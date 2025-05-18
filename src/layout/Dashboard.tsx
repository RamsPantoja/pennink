import {
	ArrowUpTrayIcon,
	DocumentPlusIcon,
	MagnifyingGlassIcon,
	SquaresPlusIcon,
} from "@heroicons/react/24/outline";
import type { Session } from "next-auth";
import { useRouter } from "next/router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Feedback } from "~/components/Feedback";
import Notifications from "~/components/Notifications";
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

type DashboardProps = {
	session: Session;
	children: ReactNode;
};

const Dashboard = ({ children, session }: DashboardProps) => {
	const router = useRouter();
	const [openDocumentLoader, setOpenDocumentLoader] = useState<boolean>(false);
	const { workspaceId } = router.query;
	const { loading: uploadingFile, onUploadFile } = useUploadObjectToStorage();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { setDocument } = useWorkspaceStore();

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
			},
			onError: (error) => {
				toast(error.message);
			},
		});

	const { mutate: initStaticsMutation } = api.user.initStatics.useMutation({
		onError: (error) => {
			toast(error.message);
		},
	});

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

		try {
			await triggerUploadFilesRuleMutation();

			if (selectedFile.type !== "application/pdf") {
				toast("Invalid file type");
				return;
			}

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
			<DocumentLoader
				onSelect={(doc) => {
					setDocument(doc);
					setOpenDocumentLoader(false);
				}}
				open={openDocumentLoader}
				onOpenChange={setOpenDocumentLoader}
			/>
			<main className="bg-mochaBase flex h-screen w-full flex-col overflow-hidden">
				<div className="flex p-1 gap-4 items-center justify-between w-full border-b border-mochaMauve">
					<SidebarTrigger className="min-w-8 h-8">
						<span>Toggle</span>
					</SidebarTrigger>
					<div className="flex items-center gap-2">
						{router.asPath !== "/" && (
							<DropdownMenu>
								<Tooltip>
									<TooltipTrigger asChild>
										<DropdownMenuTrigger asChild>
											<Button
												variant="default"
												size="icon"
												isPending={
													uploadingFile ||
													createFileIsPending ||
													triggerUploadFilesRuleIsPending
												}
											>
												<DocumentPlusIcon className="min-w-5 w-5 h-5" />
											</Button>
										</DropdownMenuTrigger>
									</TooltipTrigger>
									<TooltipContent>Load a document</TooltipContent>
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
										<ArrowUpTrayIcon className="min-w-5 w-5 h-5" />
										Upload
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => {
											setOpenDocumentLoader(true);
										}}
										className="flex gap-2"
									>
										<MagnifyingGlassIcon className="min-w-5 w-5 h-5" />
										Search
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}

						{router.asPath !== "/" && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										onClick={onNewWorkspace}
										variant="default"
										size="icon"
									>
										<SquaresPlusIcon className="min-w-5 w-5 h-5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>New workspace</TooltipContent>
							</Tooltip>
						)}
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
				<div className="flex w-full h-full gap-2 rounded-md overflow-hidden">
					{children}
				</div>
			</main>
		</SidebarProvider>
	);
};

export default Dashboard;
