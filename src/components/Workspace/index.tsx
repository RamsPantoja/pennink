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
import { DynamicForm, type Question } from "../DynamicForm";

const DynamicPDFViewer = dynamic(() => import("../common/PDFViewer"), {
	ssr: false,
	loading: () => <Loading />,
});

type WorkspaceProps = {
	session: Session;
};

type TabValue = "notes" | "chat";

// Sample questions data
const sampleQuestions: Question[] = [
	{
		id: "name",
		type: "text",
		label: "Full Name",
		placeholder: "Enter your full name",
		required: true,
	},
	{
		id: "email",
		type: "email",
		label: "Email Address",
		placeholder: "Enter your email",
		required: true,
	},
	{
		id: "age",
		type: "number",
		label: "Age",
		placeholder: "Enter your age",
		min: 18,
		max: 100,
	},
	{
		id: "bio",
		type: "textarea",
		label: "Bio",
		placeholder: "Tell us about yourself",
		description: "Brief description about yourself",
	},
	{
		id: "country",
		type: "select",
		label: "Country",
		required: true,
		options: [
			{ value: "us", label: "United States" },
			{ value: "uk", label: "United Kingdom" },
			{ value: "ca", label: "Canada" },
			{ value: "au", label: "Australia" },
			{ value: "de", label: "Germany" },
		],
	},
	{
		id: "experience",
		type: "radio",
		label: "Experience Level",
		required: true,
		options: [
			{ value: "beginner", label: "Beginner (0-1 years)" },
			{ value: "intermediate", label: "Intermediate (2-5 years)" },
			{ value: "advanced", label: "Advanced (5+ years)" },
		],
	},
	{
		id: "skills",
		type: "checkbox",
		label: "Skills",
		options: [
			{ value: "javascript", label: "JavaScript" },
			{ value: "typescript", label: "TypeScript" },
			{ value: "react", label: "React" },
			{ value: "nodejs", label: "Node.js" },
			{ value: "python", label: "Python" },
		],
	},
	{
		id: "notifications",
		type: "switch",
		label: "Email Notifications",
		description: "Receive updates via email",
	},
	{
		id: "satisfaction",
		type: "slider",
		label: "Satisfaction Level",
		min: 0,
		max: 10,
		step: 1,
		description: "Rate your satisfaction from 0 to 10",
	},
	{
		id: "birthdate",
		type: "date",
		label: "Birth Date",
	},
];

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
							<Card className="w-full h-full flex p-0 rounded-none">
								<Tabs
									value={tab}
									onValueChange={(value) => {
										setTab(value as TabValue);
									}}
									className="w-full flex flex-col h-full"
								>
									<TabsList className="grid w-full grid-cols-2 rounded-none">
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
							<div className="w-full h-full flex bg-mochaCrust overflow-auto">
								<Chat id={workspaceData.chatId} isNew={false} />
							</div>
						)}
					</ResizablePanel>
				</ResizablePanelGroup>
			)}
		</Card>
	);
};
