"use client";

import {
	ArrowUpTrayIcon,
	LanguageIcon,
	MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { Card } from "../ui/card";
import { Chat } from "../Chat";
import { typeid } from "typeid-js";
import useUploadObjectToStorage from "~/hooks/useUploadObjectToStorage";
import {
	type PenninkDocument,
	useWorkspaceStore,
} from "../Workspace/useWorkspaceStore";
import { useMemo, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import type { Session } from "next-auth";
import { Input } from "../ui/input";
import { DocumentLoader } from "../Workspace/DocumentLoader";
import { Loading } from "../common/Loading";
import { env } from "~/env";
import { fileSizeRule } from "~/lib/utils";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export const HomeComponent = () => {
	const router = useRouter();
	const utils = api.useUtils();
	const memoChatId = useMemo(() => {
		return typeid().toUUID();
	}, []);
	const { data: sessionData } = useSession();
	const { loading: uploadingFile, onUploadFile } = useUploadObjectToStorage();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { setDocument } = useWorkspaceStore();
	const [openDocumentLoader, setOpenDocumentLoader] = useState<boolean>(false);
	const [workspaceId, setWorkspaceId] = useState<string | null>(null);
	const [isReadingPDF, setIsReadingPDF] = useState<boolean>(false);

	const { mutate: createFile, isPending: createFileIsPending } =
		api.workspace.createFile.useMutation({
			onSuccess: async (data) => {
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

				router.push(`/workspace/${workspaceId}`);
				toast("You can now ask to your document!");
				await utils.user.statics.invalidate();
				await utils.workspace.filesByUserId.invalidate();
			},
			onError: (error) => {
				toast(error.message);
			},
		});

	const { mutateAsync: createWorkspace, isPending: createWorkspaceIsPending } =
		api.workspace.create.useMutation({
			onSuccess: async (data) => {
				setWorkspaceId(data.id);
				await utils.workspace.workspaces.invalidate();
				await utils.user.statics.invalidate();
			},
			onError: (error) => {
				if (error.data?.code === "PRECONDITION_FAILED") {
					toast(error.message);
				}
			},
		});

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

		if (!sessionData) {
			toast("Please sign in to upload files");
			return;
		}

		const ruleRes = fileSizeRule({
			file: selectedFile,
			session: sessionData,
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

			toast("Your file is processing, wait a moment, please...");

			if (!sessionData) {
				toast("Please sign in to upload files");
				return;
			}

			const res = await onUploadFile({
				file: selectedFile,
				path: `workspace/documents/${sessionData.user.id}`,
			});

			if (!res) {
				toast.error("No file uploaded");
				return;
			}

			const data = await createWorkspace({
				name: "...",
				messages: [],
				chatId: memoChatId,
			});

			createFile({
				workspaceId: data.id,
				type: selectedFile.type,
				filename: selectedFile.name,
				key: res.key,
			});
		} catch (error) {
			console.error(error);
		}
	};

	const onSelectSavedDocument = async (doc: PenninkDocument) => {
		try {
			const data = await createWorkspace({
				name: "...",
				messages: [],
				chatId: memoChatId,
			});

			localStorage.setItem(
				"pennink-doc",
				JSON.stringify({
					...doc,
					workspaceId: data.id,
				}),
			);

			setDocument(doc);

			router.push(`/workspace/${data.id}`);
		} catch (error) {
			console.error(error);
		}
	};

	const onStartWriting = async () => {
		try {
			const data = await createWorkspace({
				name: "...",
				messages: [],
				chatId: memoChatId,
			});

			router.push(`/workspace/${data.id}`);
		} catch (error) {
			console.error(error);
		}
	};

	const pedeningRequest =
		uploadingFile ||
		createFileIsPending ||
		createWorkspaceIsPending ||
		triggerUploadFilesRuleIsPending ||
		isReadingPDF;

	return (
		<div className="flex w-full pl-4 pr-4 pt-0 pb-4 h-full justify-center items-center">
			<Input
				ref={fileInputRef}
				type="file"
				accept="application/pdf"
				className="hidden"
				onChange={handleFileChange}
				data-testid="file-input"
			/>
			<DocumentLoader
				onSelect={(doc) => {
					onSelectSavedDocument(doc);
					setOpenDocumentLoader(false);
				}}
				open={openDocumentLoader}
				onOpenChange={setOpenDocumentLoader}
			/>
			<Card className="max-w-(--breakpoint-lg) gap-4 flex flex-col w-full justify-center h-full bg-transparent">
				<p className="text-center text-3xl font-bold text-mocha-text tracking-wider">
					Start with a new workspace!
				</p>
				<Chat id={memoChatId} isNew={true} />
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
					<Card
						onClick={
							pedeningRequest ? undefined : () => fileInputRef.current?.click()
						}
						className="border cursor-pointer bg-mocha-crust flex items-center justify-between gap-4 hover:shadow-xs"
					>
						<div className="flex flex-col">
							<p className="text-mocha-text">Upload</p>
							<p className="text-xs text-mocha-sub-text">
								Upload a PDF to start asking anything about the content
							</p>
						</div>
						{pedeningRequest ? (
							<Loading />
						) : (
							<ArrowUpTrayIcon className="min-w-5 h-5" />
						)}
					</Card>
					<Card
						onClick={
							pedeningRequest
								? undefined
								: () => {
										setOpenDocumentLoader(true);
									}
						}
						className="border cursor-pointer bg-mocha-crust flex items-center justify-between gap-4 hover:shadow-xs"
					>
						<div className="flex flex-col">
							<p className="text-mocha-text">Search</p>
							<p className="text-xs text-mocha-sub-text">
								Search the saved documents to start asking anything about the
								content
							</p>
						</div>
						{pedeningRequest ? (
							<Loading />
						) : (
							<MagnifyingGlassIcon className="min-w-5 h-5" />
						)}
					</Card>
					<Card
						onClick={pedeningRequest ? undefined : onStartWriting}
						className="border cursor-pointer bg-mocha-crust flex items-center justify-between gap-4 hover:shadow-xs"
					>
						<div className="flex flex-col">
							<p className="text-mocha-text">Write</p>
							<p className="text-xs text-mocha-sub-text">
								Start writing articles, notes or whatever you want with smart
								assistance
							</p>
						</div>
						{pedeningRequest ? (
							<Loading />
						) : (
							<LanguageIcon className="min-w-5 h-5" />
						)}
					</Card>
				</div>
			</Card>
		</div>
	);
};
