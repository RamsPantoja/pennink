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
import { Loading } from "../common/Loading";
import {
	ArrowLeftIcon,
	ArrowRightIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { useWorkspaceStore } from "./useWorkspaceStore";
import { Button } from "../common/Button";
import { useEffect, useRef, useState } from "react";
import { cn } from "~/lib/utils";
import { FormEditor } from "../FormEditor";
import { MindMap } from "../MindMap";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import type { ImperativePanelHandle } from "react-resizable-panels";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { WorkspaceSidePanel } from "./WorkspaceSidePanel";
import { LessonPlanPanel } from "../PlanArtifact/LessonPlanPanel";

export const Workspace = () => {
	const params = useParams();
	const t = useTranslations("Workspace");
	const sidePanelRef = useRef<ImperativePanelHandle>(null);
	const contentPanelRef = useRef<ImperativePanelHandle>(null);
	const {
		setWorkspaceTitle,
		displayFormEditor,
		setDisplayFormEditor,
		setAiFormData,
		setCurrentForm,
		setQueryFormData,
		displayMindMap,
		setDisplayMindMap,
		setMindMapData,
		displayLessonPlan,
		setDisplayLessonPlan,
		setLessonPlanId,
	} = useWorkspaceStore();
	const [sidePanelCollapsed, setSidePanelCollapsed] = useState(false);
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

	const onCloseContent = () => {
		setDisplayFormEditor(false);
		setAiFormData(null);
		setCurrentForm(null);
		setQueryFormData(null);
		setDisplayMindMap(false);
		setMindMapData(null);
		setDisplayLessonPlan(false);
		setLessonPlanId(null);
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
								flex: displayFormEditor || displayMindMap || displayLessonPlan,
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
						{displayFormEditor && <FormEditor />}
						{displayMindMap && <MindMap />}
						{displayLessonPlan && <LessonPlanPanel />}
					</ResizablePanel>
					<ResizableHandle
						className={cn([
							"hidden",
							{
								flex: displayFormEditor || displayMindMap || displayLessonPlan,
							},
						])}
						withHandle
					/>
					<ResizablePanel defaultSize={45} minSize={30} className="relative">
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
						<div className="w-full h-full flex bg-card">
							<Chat id={workspaceData.chatId} isNew={false} />
						</div>
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel
						defaultSize={15}
						minSize={15}
						collapsible={true}
						collapsedSize={0}
						ref={sidePanelRef}
						onCollapse={() => {
							setSidePanelCollapsed(true);
						}}
						onExpand={() => {
							setSidePanelCollapsed(false);
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
											const sidePanel = sidePanelRef.current;
											if (sidePanel) {
												sidePanel.collapse();
											}
										}}
									>
										<ArrowRightIcon className="text-foreground min-w-4 h-4" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									{t("tooltip.collapseSidePanel")}
								</TooltipContent>
							</Tooltip>
						</div>
						{sidePanelCollapsed && (
							<div className="flex items-center absolute right-2 bottom-0 top-0 my-auto w-fit h-fit">
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											className="rounded-full border border-border z-10"
											size="icon"
											onClick={() => {
												const sidePanel = sidePanelRef.current;
												if (sidePanel) {
													sidePanel.expand();
												}
											}}
										>
											<ArrowLeftIcon className="text-foreground min-w-4 h-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										{t("tooltip.expandSidePanel")}
									</TooltipContent>
								</Tooltip>
							</div>
						)}
						<WorkspaceSidePanel />
					</ResizablePanel>
				</ResizablePanelGroup>
			)}
		</Card>
	);
};
