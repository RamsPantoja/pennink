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
	ArrowDownTrayIcon,
	ChatBubbleOvalLeftIcon,
	DocumentTextIcon,
} from "@heroicons/react/24/outline";
import type { Session } from "next-auth";
import { useWorkspaceStore } from "./useWorkspaceStore";
import { SelectionToolbar } from "../common/SelectionToolbar";
import { Button } from "../common/Button";
import { useState } from "react";
import edjsParse from "editorjs-html";
import { jsPDF } from "jspdf";
import { addMarkdownStyles } from "~/utils/markdownStyles";
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
			{workspaceIsLoading && <Loading />}
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
							<Notes
								content={workspaceData.note.content}
								getNoteContent={getNoteContent}
							/>
						)}
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize={50}>
						{document && (
							<Card className="w-full h-full flex p-0 rounded-none">
								<Tabs
									defaultValue="notes"
									className="w-full flex flex-col h-full"
								>
									<TabsList className="grid w-full grid-cols-2">
										<TabsTrigger value="notes">
											<DocumentTextIcon className="min-w-5 h-5 mr-2" />
											Notes
										</TabsTrigger>
										<TabsTrigger value="chat">
											<ChatBubbleOvalLeftIcon className="min-w-5 h-5 mr-2" />
											Chat
										</TabsTrigger>
									</TabsList>
									<TabsContent
										value="notes"
										className="w-full h-full overflow-hidden"
									>
										<Notes
											content={workspaceData.note.content}
											getNoteContent={getNoteContent}
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
							<div className="w-full h-full flex p-4">
								<Chat id={workspaceData.chatId} isNew={false} />
							</div>
						)}
					</ResizablePanel>
				</ResizablePanelGroup>
			)}
		</Card>
	);
};

type NotesProps = {
	content: OutputData;
	getNoteContent: (data: OutputData) => Promise<void>;
};

const Notes = ({ content, getNoteContent }: NotesProps) => {
	const exportFromNotesToPDF = async (data: OutputData) => {
		const edjsParser = edjsParse();
		const doc = new jsPDF();
		const html = edjsParser.parse(data);
		const styledHtml = addMarkdownStyles(html);

		doc.html(styledHtml, {
			callback: (doc) => {
				doc.save("Notes");
			},
			margin: 8,
			autoPaging: "text",
		});
	};

	return (
		<div className="flex flex-col w-full h-full">
			<div className="flex flex-1 w-full h-full overflow-hidden">
				<DynamicEditor data={content} onSave={getNoteContent} />
			</div>
			<Card>
				<Button
					disabled={content.blocks.length === 0}
					variant="secondary"
					startIcon={<ArrowDownTrayIcon className="min-w-5 h-5" />}
					onClick={() => {
						exportFromNotesToPDF(content);
					}}
				>
					Export PDF
				</Button>
			</Card>
		</div>
	);
};
