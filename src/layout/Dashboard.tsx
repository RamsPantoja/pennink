"use client";
import {
	ArrowDownTrayIcon,
	CircleStackIcon,
	ListBulletIcon,
	MagnifyingGlassIcon,
	SquaresPlusIcon,
} from "@heroicons/react/24/outline";
import type { Session } from "next-auth";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Feedback } from "~/components/Feedback";
import { AppSidebar } from "~/components/Sidebar";
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
	TooltipProvider,
	TooltipTrigger,
} from "~/components/ui/tooltip";
import { env } from "~/env";
import useUploadObjectToStorage from "~/hooks/useUploadObjectToStorage";
import { fileSizeRule } from "~/lib/utils";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import PomodoroTimer from "~/components/Pomodoro";
import { FormLoader } from "~/components/Workspace/FormLoader";
import { SessionProvider } from "next-auth/react";
import { api } from "~/trpc/react";
import { useRouter, usePathname, useParams } from "next/navigation";
import { DocumentLoader } from "~/components/Workspace/DocumentLoader";
import { useTranslations } from "next-intl";

type DashboardProps = {
	session: Session;
	children: ReactNode;
};

const Dashboard = ({ children, session }: DashboardProps) => {
	const t = useTranslations("Dashboard");
	const pathname = usePathname();
	const router = useRouter();
	const params = useParams();
	const utils = api.useUtils();
	const [openDocumentLoader, setOpenDocumentLoader] = useState<boolean>(false);
	const workspaceId = params?.workspaceId;
	const { loading: uploadingFile, onUploadFile } = useUploadObjectToStorage();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const {
		setDocument,
		setCurrentForm,
		setDisplayFormEditor,
		resetWorkspaceStore,
	} = useWorkspaceStore();
	const [isReadingPDF, setIsReadingPDF] = useState<boolean>(false);
	const [openFormLoader, setOpenFormLoader] = useState<boolean>(false);

	const { mutate: createFile, isPending: createFileIsPending } =
		api.workspace.createFile.useMutation({
			onSuccess: async (data) => {
				toast(t("toast.success.upload"));
				const doc = {
					id: data.id,
					filename: data.filename,
					type: data.type,
					src: `${env.NEXT_PUBLIC_BUCKET_PUBLIC_DOMAIN}/${data.key}`,
				};

				localStorage.setItem(
					"pennink-doc",
					JSON.stringify({
						...doc,
						workspaceId,
					}),
				);

				setDocument(doc);
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

		if (!ruleRes.isValid) return;

		if (selectedFile.type !== "application/pdf") {
			toast(t("toast.error.invalidFileType"));
			return;
		}

		setIsReadingPDF(true);
		const loader = new WebPDFLoader(selectedFile);
		const docs = await loader.load();
		setIsReadingPDF(false);

		if (docs.length === 0) {
			toast(t("toast.error.noPages"));
			return;
		}

		if (docs.length > 50) {
			toast(t("toast.error.tooManyPages", { count: docs.length }));
			return;
		}

		try {
			await triggerUploadFilesRuleMutation();

			if (typeof workspaceId !== "string") {
				toast(t("toast.error.invalidWorkspaceId"));
				return;
			}

			toast(t("toast.info.processing"));

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
		router.push("/");
		resetWorkspaceStore();
	};

	return (
		<SessionProvider session={session}>
			<SidebarProvider>
				<TooltipProvider delayDuration={300}>
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
						onOpen={(form) => {
							setDisplayFormEditor(true);
							setCurrentForm(form);
							setOpenFormLoader(false);
							setDocument(null);
						}}
						open={openFormLoader}
						onOpenChange={setOpenFormLoader}
					/>
					<DocumentLoader
						onSelect={(doc) => {
							setDocument(doc);
							setOpenDocumentLoader(false);
							setDisplayFormEditor(false);
							setCurrentForm(null);
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
					<main className="bg-mocha-base flex h-full w-full flex-col overflow-hidden">
						<div className="flex p-2 gap-4 items-center justify-between w-full border-b border-mocha-mauve">
							<div className="flex items-center gap-2">
								<SidebarTrigger className="min-w-8 h-8">
									<span>{t("sidebar.toggle")}</span>
								</SidebarTrigger>
								<p className="text-xs text-mocha-sub-text">
									{t("sidebar.shortcut")}
								</p>
							</div>
							<div className="flex items-center gap-2">
								{pathname !== "/" && (
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
										<TooltipContent>{t("tooltips.searchForms")}</TooltipContent>
									</Tooltip>
								)}
								{pathname !== "/" && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												onClick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													setOpenDocumentLoader(true);
												}}
											>
												<CircleStackIcon className="min-w-5 w-5 h-5" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											{t("tooltips.searchSources")}
										</TooltipContent>
									</Tooltip>
								)}
								{pathname !== "/" && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												onClick={() => fileInputRef.current?.click()}
												variant="ghost"
												size="icon"
												isPending={
													uploadingFile ||
													createFileIsPending ||
													triggerUploadFilesRuleIsPending ||
													isReadingPDF
												}
											>
												<ArrowDownTrayIcon className="min-w-5 w-5 h-5" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>{t("dropdown.importPDF")}</TooltipContent>
									</Tooltip>
								)}
								{pathname !== "/" && (
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												onClick={onNewWorkspace}
												variant="ghost"
												size="icon"
											>
												<SquaresPlusIcon className="min-w-5 w-5 h-5" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											{t("tooltips.newWorkspace")}
										</TooltipContent>
									</Tooltip>
								)}
								{pathname !== "/" && <PomodoroTimer />}
								<Feedback session={session} />
							</div>
						</div>
						<div className="flex w-full h-full gap-2 overflow-hidden">
							{children}
						</div>
					</main>
				</TooltipProvider>
			</SidebarProvider>
		</SessionProvider>
	);
};

// <DropdownMenu modal={false}>

// 										<DropdownMenuContent
// 											side="right"
// 											onCloseAutoFocus={(e) => {
// 												e.preventDefault();
// 												e.stopPropagation();
// 											}}
// 										>
// 											<DropdownMenuItem
// 												onClick={() => fileInputRef.current?.click()}
// 												className="flex gap-2"
// 											>
// 												<ArrowDownTrayIcon className="min-w-5 w-5 h-5" />
// 												{t("dropdown.importPDF")}
// 											</DropdownMenuItem>
// 											<DropdownMenuItem
// 												onClick={(e) => {
// 													e.preventDefault();
// 													e.stopPropagation();
// 													setOpenDocumentLoader(true);
// 												}}
// 												className="flex gap-2"
// 											>
// 												<MagnifyingGlassIcon className="min-w-5 w-5 h-5" />
// 												{t("dropdown.searchSources")}
// 											</DropdownMenuItem>
// 										</DropdownMenuContent>
// 									</DropdownMenu>

export default Dashboard;
