import { useRouter } from "next/router";
import { Card } from "../ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
	ChatBubbleOvalLeftIcon,
	DocumentTextIcon,
} from "@heroicons/react/24/outline";
import type { Session } from "next-auth";
import { useWorkspaceStore } from "./useWorkspaceStore";
import { SelectionToolbar } from "../common/SelectionToolbar";
import { Button } from "../common/Button";
import { useState } from "react";
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
	const { workspaceId } = router.query;
	const utils = api.useUtils();
	const { document, setReaderEvent } = useWorkspaceStore();
	const [selection, setSelection] = useState<{
		text: string;
		range: Range | null;
	}>({
		text: "",
		range: null,
	});

	const {
		data: workspaceData,
		isLoading: workspaceIsLoading,
		isError: workspaceIsError,
	} = api.workspace.workspaceById.useQuery({
		id: workspaceId as string,
	});

	const { mutate: updateWorkspace } = api.note.updateNote.useMutation({
		onSuccess: async () => {
			await utils.workspace.workspaceById.invalidate();
		},
		onError: (error) => {
			toast(error.message);
		},
	});

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

	const onSummarizeFromReader = () => {
		setReaderEvent({ type: "reader-on-summarize", data: selection.text });
		setSelection({ text: "", range: null });
	};

	const onChatFromReader = () => {
		setReaderEvent({ type: "reader-on-chat", data: selection.text });
		setSelection({ text: "", range: null });
	};

	const onExplainFromReader = () => {
		setReaderEvent({ type: "reader-on-explain", data: selection.text });
		setSelection({ text: "", range: null });
	};

	return (
		<Card
			className="w-full h-full flex flex-col items-center p-0 rounded-none"
			key={workspaceId as string}
		>
			{workspaceIsLoading && <SkeletonWorkspace />}
			{workspaceIsError && (
				<FeedbackMessage
					status="ERROR"
					message="Algo salió mal, inténtalo de nuevo más tarde."
				/>
			)}
			{!workspaceIsLoading && !workspaceIsError && workspaceData && (
				<ResizablePanelGroup
					direction="horizontal"
					className="min-h-[200px] w-full rounded-xl md:min-w-[450px] flex h-full"
				>
					<ResizablePanel defaultSize={50}>
						{document && (
							<div className="flex w-full h-full flex-col">
								<p className="text-center text-xs pt-4 text-mochaMauve font-bold">
									Content
								</p>
								<SelectionToolbar
									selection={selection}
									setSelection={setSelection}
									tools={[
										<Button
											className="bg-mochaTeal text-mochaMauve hover:text-mochaBase hover:bg-mochaMauve"
											key="summarize"
											onClick={onSummarizeFromReader}
										>
											Summarize
										</Button>,
										<Button
											className="bg-mochaTeal text-mochaMauve hover:text-mochaBase hover:bg-mochaMauve"
											key="chat"
											onClick={onChatFromReader}
										>
											Chat
										</Button>,
										<Button
											className="bg-mochaTeal text-mochaMauve hover:text-mochaBase hover:bg-mochaMauve"
											key="explain"
											onClick={onExplainFromReader}
										>
											Explain
										</Button>,
									]}
								>
									<DynamicPDFViewer src={document.src} />
								</SelectionToolbar>
							</div>
						)}
						{!document && (
							<div className="w-full h-full flex p-4">
								<Chat id={workspaceData.chatId} isNew={false} />
							</div>
						)}
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize={50}>
						{document && (
							<Card className="w-full h-full flex p-0 rounded-none">
								<Tabs
									defaultValue="chat"
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
										<div className="w-full h-full flex p-4">
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
