import { useRouter } from "next/router";
import { Card, CardContent } from "../ui/card";
import { api } from "~/utils/api";
import { Chat } from "../Chat";
import { SkeletonWorkspace } from "./Skeleton";
import FeedbackMessage from "../common/FeedbackMessage";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "../ui/resizable";
import dynamic from "next/dynamic";
import { Loading } from "../common/Loading";
import type { OutputData } from "@editorjs/editorjs";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
	BookOpenIcon,
	ChatBubbleLeftIcon,
	ChatBubbleLeftRightIcon,
	ChatBubbleOvalLeftIcon,
	DocumentTextIcon,
} from "@heroicons/react/24/outline";
import useUploadObjectToStorage from "~/hooks/useUploadObjectToStorage";
import type { Session } from "next-auth";
import { useWorkspaceStore } from "./useWorkspaceStore";
const DynamicEditor = dynamic(() => import("../Editor"), {
	ssr: false,
	loading: () => <Loading />,
});

const DynamicPDFViewer = dynamic(() => import("../common/PDFViewer"), {
	ssr: false,
	loading: () => <Loading />,
});

type WorkspaceProps = {
	session: Session;
};

export const Workspace = ({ session }: WorkspaceProps) => {
	const router = useRouter();
	const { id } = router.query;
	const utils = api.useUtils();
	const {
		data: workspaceData,
		isLoading: workspaceIsLoading,
		isError: workspaceIsError,
	} = api.workspace.workspaceById.useQuery({
		id: id as string,
	});

	const { document } = useWorkspaceStore();

	const { loading, onUploadFile } = useUploadObjectToStorage();

	const { mutate: updateWorkspace } = api.note.updateNote.useMutation({
		onSuccess: async () => {
			await utils.workspace.workspaceById.invalidate();
		},
		onError: (error) => {
			toast(error.message);
		},
	});

	const { mutate: createFile, isPending: createFileIsPending } =
		api.workspace.createFile.useMutation({
			onSuccess: async () => {
				toast("You can now ask to your document!");
			},
			onError: (error) => {
				toast(error.message);
			},
		});

	const onUploadDocument = async (file: File) => {
		if (typeof id !== "string") {
			toast("Invalid workspace ID");
			return;
		}

		const res = await onUploadFile({
			file,
			path: `workspace/documents/${session.user.id}`,
		});

		if (!res) {
			return;
		}

		createFile({
			type: file.type,
			filename: file.name,
			key: res.key,
			workspaceId: id,
		});
	};

	const getNoteContent = async (data: OutputData) => {
		const { version, time, blocks } = data;

		if (!workspaceData?.noteId) {
			toast("Invalid note ID");
			return;
		}

		updateWorkspace({
			noteId: workspaceData.noteId,
			content: {
				version,
				time,
				blocks,
			},
		});
	};

	return (
		<Card className="w-full h-full flex flex-col items-center p-0 rounded-none">
			{workspaceIsLoading && <SkeletonWorkspace />}
			{workspaceIsError && (
				<FeedbackMessage
					status="ERROR"
					message="Algo salió mal, inténtalo de nuevo más tarde."
				/>
			)}
			{workspaceData && (
				<ResizablePanelGroup
					direction="horizontal"
					className="min-h-[200px] w-full rounded-xl md:min-w-[450px] flex h-full"
				>
					<ResizablePanel defaultSize={50}>
						{document && <DynamicPDFViewer src={document.src} />}
						{!document && (
							<div className="w-full h-full flex">
								<Chat id={workspaceData.chatId} isNew={false} />
							</div>
						)}
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize={50}>
						{document && (
							<Card
								className="w-full h-full flex p-0 rounded-none"
								key={id as string}
							>
								<Tabs
									defaultValue="notes"
									className="w-full flex flex-col h-full"
								>
									<TabsList className="grid w-full grid-cols-2">
										<TabsTrigger value="chat">
											<ChatBubbleOvalLeftIcon className="min-w-5 h-5 mr-2" />
											Chat
										</TabsTrigger>
										<TabsTrigger value="notes">
											<DocumentTextIcon className="min-w-5 h-5 mr-2" />
											Notes
										</TabsTrigger>
									</TabsList>
									<TabsContent
										value="notes"
										className="w-full h-full overflow-hidden"
									>
										<DynamicEditor
											data={workspaceData.note.content}
											onSave={getNoteContent}
										/>
									</TabsContent>
									<TabsContent
										value="chat"
										className="w-full h-full overflow-hidden"
									>
										<div className="w-full h-full flex">
											<Chat id={workspaceData.chatId} isNew={false} />
										</div>
									</TabsContent>
								</Tabs>
							</Card>
						)}
						{!document && (
							<DynamicEditor
								data={workspaceData.note.content}
								onSave={getNoteContent}
							/>
						)}
					</ResizablePanel>
				</ResizablePanelGroup>
			)}
		</Card>
	);
};
