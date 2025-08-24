import { useRouter } from "next/router";
import { Card } from "../ui/card";
import { api } from "~/utils/api";
import { Chat } from "../Chat";
import FeedbackMessage from "../common/FeedbackMessage";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "../ui/resizable";
import dynamic from "next/dynamic";
import { Loading } from "../common/Loading";
import { toast } from "sonner";
import {
	ArrowLeftIcon,
	ArrowRightCircleIcon,
	ArrowRightIcon,
	ChatBubbleOvalLeftIcon,
	DocumentTextIcon,
} from "@heroicons/react/24/outline";
import type { Session } from "next-auth";
import { useWorkspaceStore } from "./useWorkspaceStore";
import { SelectionToolbar } from "../common/SelectionToolbar";
import { Button } from "../common/Button";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { Editor } from "../Editor";
import type { Block } from "@blocknote/core";
import { DynamicForm } from "../DynamicForm";
import { FormEditor } from "../FormEditor";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import type { ImperativePanelHandle } from "react-resizable-panels";

const DynamicPDFViewer = dynamic(() => import("../common/PDFViewer"), {
	ssr: false,
	loading: () => <Loading />,
});

type WorkspaceProps = {
	session: Session;
};

type TabValue = "notes" | "chat";

export const Workspace = ({ session }: WorkspaceProps) => {
	const router = useRouter();
	const { workspaceId } = router.query;
	const chatPanelRef = useRef<ImperativePanelHandle>(null);
	const utils = api.useUtils();
	const {
		document,
		setReaderEvent,
		setWorkspaceTitle,
		displayFormEditor,
		formData,
	} = useWorkspaceStore();
	const [selectionContent, setSelectionContent] = useState<{
		text: string;
		range: Range | null;
	}>({
		text: "",
		range: null,
	});
	const [tab, setTab] = useState<TabValue>("chat");
	const [chatPanelCollapsed, setChatPanelCollapsed] = useState(false);

	const {
		data: workspaceData,
		isLoading: workspaceIsLoading,
		isError: workspaceIsError,
	} = api.workspace.workspaceById.useQuery({
		id: workspaceId as string,
	});

	useEffect(() => {
		if (!workspaceData) return;
		setWorkspaceTitle(workspaceData.name);
	}, [workspaceData, setWorkspaceTitle]);

	const { mutate: updateWorkspace } = api.note.updateNote.useMutation({
		onSuccess: async () => {
			await utils.workspace.workspaceById.invalidate();
		},
		onError: (error) => {
			toast(error.message);
		},
	});

	const getNoteContent = async (data: Block[]) => {
		if (!workspaceData?.noteId) {
			toast("Invalid note ID");
			return;
		}

		updateWorkspace({
			noteId: workspaceData.noteId,
			content: data,
		});
	};

	const onSummarizeFromReader = () => {
		setTab("chat");
		setReaderEvent({
			type: "reader-on-summarize",
			data: selectionContent.text,
		});
		setSelectionContent({ text: "", range: null });
	};

	const onChatFromReader = () => {
		setTab("chat");
		setReaderEvent({ type: "reader-on-chat", data: selectionContent.text });
		setSelectionContent({ text: "", range: null });
	};

	const onExplainFromReader = () => {
		setTab("chat");
		setReaderEvent({ type: "reader-on-explain", data: selectionContent.text });
		setSelectionContent({ text: "", range: null });
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
					message="Something went wrong, try again later."
				/>
			)}
			{!workspaceIsLoading && !workspaceIsError && workspaceData && (
				<ResizablePanelGroup
					direction="horizontal"
					className="min-h-[200px] w-full md:min-w-[450px] flex h-full"
				>
					<ResizablePanel
						className={cn([
							"hidden",
							{
								flex: displayFormEditor || document,
							},
						])}
					>
						{formData && !document && <FormEditor />}
						{document && !formData && (
							<div className="flex w-full h-full flex-col">
								<SelectionToolbar
									selection={selectionContent}
									setSelection={setSelectionContent}
									tools={[
										<Button
											variant="ghost"
											key="summarize"
											onClick={onSummarizeFromReader}
										>
											Summarize
										</Button>,
										<Button
											variant="ghost"
											key="chat"
											onClick={onChatFromReader}
										>
											Chat
										</Button>,
										<Button
											variant="ghost"
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
					</ResizablePanel>
					<ResizableHandle
						className={cn([
							"hidden",
							{
								flex: displayFormEditor || document,
							},
						])}
						withHandle
					/>
					<ResizablePanel className="relative">
						{chatPanelCollapsed && (
							<div className="flex items-center absolute right-2 bottom-0 top-0 my-auto w-fit h-fit">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											className="rounded-full border border-mochaMauve z-10"
											size="icon"
											onClick={() => {
												const chatPanel = chatPanelRef.current;
												if (chatPanel) {
													chatPanel.expand();
												}
											}}
										>
											<ArrowLeftIcon className="text-mochaText min-w-4 h-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Expand chat</TooltipContent>
								</Tooltip>
							</div>
						)}
						<Editor data={workspaceData.note.content} onSave={getNoteContent} />
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel
						defaultSize={30}
						collapsible={true}
						collapsedSize={0}
						minSize={30}
						ref={chatPanelRef}
						onCollapse={() => {
							setChatPanelCollapsed(true);
						}}
						onExpand={() => {
							setChatPanelCollapsed(false);
						}}
					>
						<div className="w-full h-full flex bg-mochaCrust flex-col">
							<div className="w-full flex p-2">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => {
												const chatPanel = chatPanelRef.current;
												if (chatPanel) {
													chatPanel.collapse();
												}
											}}
										>
											<ArrowRightIcon className="text-mochaText min-w-5 h-5" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Collapse chat</TooltipContent>
								</Tooltip>
							</div>
							<div className="flex flex-1 overflow-auto">
								<Chat id={workspaceData.chatId} isNew={false} />
							</div>
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>
			)}
		</Card>
	);
};
