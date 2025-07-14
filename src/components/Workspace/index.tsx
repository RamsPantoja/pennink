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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
	ChatBubbleOvalLeftIcon,
	DocumentTextIcon,
} from "@heroicons/react/24/outline";
import type { Session } from "next-auth";
import { useWorkspaceStore } from "./useWorkspaceStore";
import { SelectionToolbar } from "../common/SelectionToolbar";
import { Button } from "../common/Button";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";
import { Editor } from "../Editor";
import type { Block } from "@blocknote/core";

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
	const utils = api.useUtils();
	const { document, setReaderEvent, setWorkspaceTitle } = useWorkspaceStore();
	const [selectionContent, setSelectionContent] = useState<{
		text: string;
		range: Range | null;
	}>({
		text: "",
		range: null,
	});
	const [tab, setTab] = useState<TabValue>("notes");

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
					<ResizablePanel defaultSize={50}>
						{document && (
							<div className="flex w-full h-full flex-col">
								<p className="text-center text-xs pt-4 text-mochaMauve font-bold">
									Content
								</p>
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
						{!document && (
							<Editor
								data={workspaceData.note.content}
								onSave={getNoteContent}
							/>
						)}
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize={50}>
						{document && (
							<Card className="w-full h-full flex p-2 rounded-none">
								<Tabs
									value={tab}
									onValueChange={(value) => {
										setTab(value as TabValue);
									}}
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
										<Editor
											data={workspaceData.note.content}
											onSave={getNoteContent}
										/>
									</TabsContent>
									<TabsContent
										value="chat"
										className={cn([
											"w-full h-full overflow-hidden hidden",
											{
												block: tab === "chat",
											},
										])}
										forceMount={true}
									>
										<div className="w-full h-full flex">
											<Chat id={workspaceData.chatId} isNew={false} />
										</div>
									</TabsContent>
								</Tabs>
							</Card>
						)}
						{!document && (
							<div className="w-full h-full flex bg-mochaCrust">
								<Chat id={workspaceData.chatId} isNew={false} />
							</div>
						)}
					</ResizablePanel>
				</ResizablePanelGroup>
			)}
		</Card>
	);
};
