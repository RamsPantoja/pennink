"use client";
import { Card } from "../ui/card";
import { api } from "~/trpc/react";
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
	ArrowRightIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { type PenninkDocument, useWorkspaceStore } from "./useWorkspaceStore";
import { SelectionToolbar } from "../common/SelectionToolbar";
import { Button } from "../common/Button";
import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { AgentVisual } from "../AgentVisual";
import { FormEditor } from "../FormEditor";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

type PreviousDocOpened = PenninkDocument & { workspaceId: string };
const DynamicPDFViewer = dynamic(() => import("../common/PDFViewer"), {
	ssr: false,
	loading: () => <Loading />,
});

export const Workspace = () => {
	const params = useParams();
	const t = useTranslations("Workspace");
	const chatPanelRef = useRef<ImperativePanelHandle>(null);
	const contentPanelRef = useRef<ImperativePanelHandle>(null);
	const {
		document,
		setReaderEvent,
		setWorkspaceTitle,
		displayFormEditor,
		setDocument,
		setDisplayFormEditor,
		setAiContextItems,
		aiContextItems,
		setAiFormData,
		setCurrentForm,
		setQueryFormData,
	} = useWorkspaceStore();
	const [selectionContent, setSelectionContent] = useState<{
		text: string;
		range: Range | null;
	}>({
		text: "",
		range: null,
	});
	const [chatPanelCollapsed, setChatPanelCollapsed] = useState(false);
	const [contentPanelCollapsed, setContentPanelCollapsed] = useState(false);

	const {
		data: workspaceData,
		isLoading: workspaceIsLoading,
		isError: workspaceIsError,
	} = api.workspace.workspaceById.useQuery({
		id: params?.workspaceId as string,
	});

	useEffect(() => {
		if (!workspaceData) return;
		setWorkspaceTitle(workspaceData.name);
	}, [workspaceData, setWorkspaceTitle]);

	useEffect(() => {
		const previousDocOpened = localStorage.getItem("pennink-doc");

		if (previousDocOpened) {
			const doc = JSON.parse(previousDocOpened) as PreviousDocOpened;

			if (doc.workspaceId === params?.workspaceId) {
				setDocument({
					id: doc.id,
					filename: doc.filename,
					type: doc.type,
					src: doc.src,
				});
			}
		}
	}, [params?.workspaceId, setDocument]);

	const onSummarizeFromReader = () => {
		setReaderEvent({
			type: "reader-on-summarize",
			data: selectionContent.text,
		});
		setSelectionContent({ text: "", range: null });
	};

	const onChatFromReader = () => {
		setReaderEvent({ type: "reader-on-chat", data: selectionContent.text });
		setSelectionContent({ text: "", range: null });
	};

	const onExplainFromReader = () => {
		setReaderEvent({ type: "reader-on-explain", data: selectionContent.text });
		setSelectionContent({ text: "", range: null });
	};

	const onCloseContent = () => {
		setDocument(null);
		setDisplayFormEditor(false);
		setAiContextItems([
			...aiContextItems.filter(
				(item) => item.type !== "document" && item.type !== "form",
			),
		]);
		setAiFormData(null);
		setCurrentForm(null);
		setQueryFormData(null);
	};

	return (
		<Card
			className="w-full h-full flex flex-col items-center p-0 rounded-none"
			key={params?.workspaceId as string}
		>
			{workspaceIsLoading && <Loading />}
			{workspaceIsError && (
				<FeedbackMessage status="ERROR" message={t("error.workspaceLoad")} />
			)}
			{!workspaceIsLoading && !workspaceIsError && workspaceData && (
				<ResizablePanelGroup
					direction="horizontal"
					className="min-h-[200px] w-full md:min-w-[450px] flex h-full"
				>
					<ResizablePanel
						defaultSize={30}
						collapsible={true}
						collapsedSize={0}
						ref={contentPanelRef}
						onCollapse={() => {
							setContentPanelCollapsed(true);
						}}
						onExpand={() => {
							setContentPanelCollapsed(false);
						}}
						className={cn([
							"hidden relative",
							{
								flex: displayFormEditor || document,
							},
						])}
					>
						<div className="flex items-center flex-col absolute right-2 bottom-0 top-0 my-auto w-fit h-fit gap-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										className="rounded-full border border-border z-10"
										size="icon"
										onClick={() => {
											const contentPanel = contentPanelRef.current;
											if (contentPanel) {
												contentPanel.collapse();
											}
										}}
									>
										<ArrowLeftIcon className="text-foreground min-w-4 h-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>{t("tooltip.collapseContent")}</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										className="rounded-full border border-border z-10"
										size="icon"
										onClick={onCloseContent}
									>
										<XMarkIcon className="text-foreground min-w-4 h-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>{t("tooltip.closeContent")}</TooltipContent>
							</Tooltip>
						</div>
						{!document && displayFormEditor && <FormEditor />}
						{document && !displayFormEditor && (
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
											{t("button.summarize")}
										</Button>,
										<Button
											variant="ghost"
											key="chat"
											onClick={onChatFromReader}
										>
											{t("button.chat")}
										</Button>,
										<Button
											variant="ghost"
											key="explain"
											onClick={onExplainFromReader}
										>
											{t("button.explain")}
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
											className="rounded-full border border-border z-10"
											size="icon"
											onClick={() => {
												const chatPanel = chatPanelRef.current;
												if (chatPanel) {
													chatPanel.expand();
												}
											}}
										>
											<ArrowLeftIcon className="text-foreground min-w-4 h-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>{t("tooltip.expandChat")}</TooltipContent>
								</Tooltip>
							</div>
						)}
						{contentPanelCollapsed && (
							<div className="flex items-center absolute left-2 bottom-0 top-0 my-auto w-fit h-fit z-10">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											className="rounded-full border border-border z-10"
											onClick={() => {
												const contentPanel = contentPanelRef.current;
												if (contentPanel) {
													contentPanel.expand();
												}
											}}
										>
											<ArrowRightIcon className="text-foreground min-w-4 h-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>{t("tooltip.expandContent")}</TooltipContent>
								</Tooltip>
							</div>
						)}
						<AgentVisual />
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel
						defaultSize={30}
						collapsible={true}
						collapsedSize={0}
						ref={chatPanelRef}
						onCollapse={() => {
							setChatPanelCollapsed(true);
						}}
						onExpand={() => {
							setChatPanelCollapsed(false);
						}}
						className="relative"
					>
						<div className="flex items-center absolute left-2 bottom-0 top-0 my-auto w-fit h-fit z-10">
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="rounded-full border border-border z-10"
										onClick={() => {
											const chatPanel = chatPanelRef.current;
											if (chatPanel) {
												chatPanel.collapse();
											}
										}}
									>
										<ArrowRightIcon className="text-foreground min-w-4 h-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>{t("tooltip.collapseChat")}</TooltipContent>
							</Tooltip>
						</div>
						<div className="w-full h-full flex bg-card">
							<Chat id={workspaceData.chatId} isNew={false} />
						</div>
					</ResizablePanel>
				</ResizablePanelGroup>
			)}
		</Card>
	);
};
