import {
	ArrowUpTrayIcon,
	LinkIcon,
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
import { useRef, useState } from "react";
import { api } from "~/utils/api";
import { toast } from "sonner";
import type { Session } from "next-auth";
import { Input } from "../ui/input";
import { DocumentLoader } from "../Workspace/DocumentLoader";
import { useRouter } from "next/router";
import { Loading } from "../common/Loading";
import { env } from "~/env";

type HomeComponentProps = {
	session: Session;
};

type UploadedFile = {
	type: string;
	filename: string;
	key: string;
};

export const HomeComponent = ({ session }: HomeComponentProps) => {
	const router = useRouter();
	const chatId = typeid().toUUID();
	const { loading: uploadingFile, onUploadFile } = useUploadObjectToStorage();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const { setDocument } = useWorkspaceStore();
	const [openDocumentLoader, setOpenDocumentLoader] = useState<boolean>(false);
	const [workspaceId, setWorkspaceId] = useState<string | null>(null);

	const { mutate: createFile, isPending: createFileIsPending } =
		api.workspace.createFile.useMutation({
			onSuccess: async (data) => {
				router.push(`/workspace/${workspaceId}`);
				setDocument({
					id: data.id,
					filename: data.filename,
					type: data.type,
					src: `${env.NEXT_PUBLIC_BUCKET_PUBLIC_DOMAIN}/${data.key}`,
				});
				toast("You can now ask to your document!");
			},
			onError: (error) => {
				toast(error.message);
			},
		});

	const { mutateAsync: createWorkspace, isPending: createWorkspaceIsPending } =
		api.workspace.create.useMutation({
			onSuccess: async (data) => {
				setWorkspaceId(data.id);
			},
			onError: (error) => {
				if (error.data?.code === "PRECONDITION_FAILED") {
					toast(error.message);
				}
			},
		});

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];

		if (!selectedFile) return;

		if (selectedFile.type !== "application/pdf") {
			toast("Invalid file type");
			return;
		}

		toast("Your file is processing, wait a moment, please...");

		try {
			const res = await onUploadFile({
				file: selectedFile,
				path: `workspace/documents/${session.user.id}`,
			});

			if (!res) {
				toast.error("No file uploaded");
				return;
			}

			const data = await createWorkspace({
				name: "...",
				messages: [],
				chatId,
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
		setDocument(doc);

		try {
			const data = await createWorkspace({
				name: "...",
				messages: [],
				chatId,
			});

			await router.push(`/workspace/${data.id}`);
		} catch (error) {
			console.error(error);
		}
	};

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
			<Card className="max-w-screen-lg gap-4 flex flex-col w-full justify-center h-full">
				<p className="text-center text-3xl font-bold text-mochaText">
					What can I help with?
				</p>
				<Chat id={chatId} isNew={true} />
				<div className="grid grid-cols-3 gap-4">
					<Card
						onClick={
							uploadingFile || createFileIsPending || createWorkspaceIsPending
								? undefined
								: () => fileInputRef.current?.click()
						}
						className="border cursor-pointer bg-mochaCrust flex items-center justify-between gap-4 hover:shadow-sm"
					>
						<div className="flex flex-col">
							<p className="text-mochaText">Upload</p>
							<p className="text-xs text-mochaSubText">
								Upload a PDF to start asking anything about the content
							</p>
						</div>
						{uploadingFile ||
						createFileIsPending ||
						createWorkspaceIsPending ? (
							<Loading />
						) : (
							<ArrowUpTrayIcon className="min-w-5 h-5" />
						)}
					</Card>
					<Card
						onClick={
							uploadingFile || createFileIsPending || createWorkspaceIsPending
								? undefined
								: () => {
										setOpenDocumentLoader(true);
									}
						}
						className="border cursor-pointer bg-mochaCrust flex items-center justify-between gap-4 hover:shadow-sm"
					>
						<div className="flex flex-col">
							<p className="text-mochaText">Search</p>
							<p className="text-xs text-mochaSubText">
								Search the saved documents to start asking anything about the
								content
							</p>
						</div>
						{uploadingFile ||
						createFileIsPending ||
						createWorkspaceIsPending ? (
							<Loading />
						) : (
							<MagnifyingGlassIcon className="min-w-5 h-5" />
						)}
					</Card>
					{/* <Card className="border cursor-pointer bg-mochaCrust flex items-center justify-between gap-4 hover:shadow-sm">
						<div className="flex flex-col">
							<p className="text-mochaText">Paste</p>
							<p className="text-xs text-mochaSubText">
								Paste a link to a website or a YouTube video to start asking
								anything about it
							</p>
						</div>
						<LinkIcon className="min-w-5 h-5" />
					</Card> */}
				</div>
			</Card>
		</div>
	);
};
