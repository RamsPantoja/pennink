import {
	ArrowTurnDownRightIcon,
	Bars3BottomLeftIcon,
	ChatBubbleOvalLeftIcon,
	DocumentTextIcon,
	ListBulletIcon,
	PencilSquareIcon,
	PlusIcon,
	StopIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../common/Button";
import { Card } from "../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ArrowUpIcon } from "lucide-react";
import { type ChatModes, useChatLogic } from "./useChatLogic";
import { MessageCard } from "./MessageCard";
import { ChatSkeleton } from "./ChatSkeleton";
import FeedbackMessage from "../common/FeedbackMessage";
import { cn } from "~/lib/utils";
import { ScrollToBottomButton } from "../common/ScrollToBottomButton";
import { AutoResizeTextarea } from "../common/AutoSizeTextarea";
import { Controller } from "react-hook-form";
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group";
import { Separator } from "../ui/separator";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { BrainIcon } from "lucide-react";

type ChatProps = {
	id: string;
	isNew: boolean;
};

export const Chat = ({ id, isNew }: ChatProps) => {
	const {
		onSentPrompt,
		useChatForm,
		currentAssistantMessage,
		messages,
		createWorkspaceIsPending,
		messagesIsLoading,
		messagesIsError,
		chatContainer,
		quote,
		onRemoveQuote,
		onToggleChatModes,
		chatModes,
		document,
		documentVectorSearchMutationIsPending,
		stopStreaming,
		handleKeyDown,
		triggerChatMessagesRuleIsPending,
		contextItems,
		setContextItems,
		status,
	} = useChatLogic({ chatId: id, isNew });

	const { handleSubmit, watch, control } = useChatForm;

	return (
		<Card
			className={cn([
				"flex flex-col gap-4 overflow-hidden p-0 relative w-full rounded-none bg-transparent",
				{
					"flex-1": messages.length > 0,
				},
			])}
		>
			{messagesIsLoading && <ChatSkeleton />}
			{!messagesIsLoading && messagesIsError && (
				<FeedbackMessage status="ERROR" message="Error fetching messages" />
			)}
			<div className="flex flex-1 overflow-hidden relative">
				<div
					ref={chatContainer}
					className="flex flex-col gap-4 overflow-auto p-4 flex-1 relative"
					id="chat-container"
				>
					{messages.length === 0 && !isNew && (
						<Card className="flex flex-col gap-2 items-center justify-center flex-1 bg-transparent">
							<BrainIcon className="min-w-16 h-16 animate-pulse" />
							<p className="font-bold">Chat with AI</p>
							<p className="text-sm">
								Ask anything or use the tools available below
							</p>
						</Card>
					)}
					{messages.length > 0 &&
						messages.map((message) => (
							<MessageCard key={message.id} message={message} />
						))}
					{currentAssistantMessage && (
						<div className="flex flex-1 min-h-96">
							<MessageCard
								isStreaming={status === "streaming"}
								message={currentAssistantMessage}
							/>
						</div>
					)}
				</div>
				<ScrollToBottomButton scrollableElementId="chat-container" />
			</div>
			{!isNew && <Separator />}
			<div className="flex flex-col gap-2 p-3">
				{!isNew && (
					<div className="flex items-center gap-2">
						<DropdownMenu>
							<DropdownMenuTrigger
								asChild
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
								}}
								className="h-8 min-w-8 w-fit inline-flex gap-2 items-center justify-center whitespace-nowrap rounded-md"
							>
								<Button
									variant="outline"
									onClick={stopStreaming}
									size="icon"
									disabled={false}
								>
									<PlusIcon className="min-w-5 w-5 h-5" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								side="right"
								onCloseAutoFocus={(e) => {
									e.preventDefault();
									e.stopPropagation();
								}}
							>
								<DropdownMenuItem
									onClick={(e) => {
										if (
											!contextItems.find((item) => item.type === "document")
										) {
											setContextItems((prevItems) => [
												...prevItems,
												{
													label: "Document",
													type: "document",
												},
											]);
										}
									}}
									disabled={!document}
									className="flex gap-2"
								>
									<DocumentTextIcon className="min-w-5 w-5 h-5" />
									Current document
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={(e) => {
										if (!contextItems.find((item) => item.type === "editor")) {
											setContextItems((prevItems) => [
												...prevItems,
												{
													label: "Editor",
													type: "editor",
												},
											]);
										}
									}}
									className="flex gap-2"
								>
									<Bars3BottomLeftIcon className="min-w-5 w-5 h-5" />
									Editor content
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
						{contextItems.length === 0 && (
							<span className="text-xs text-mochaSubText">Add context...</span>
						)}
						{contextItems.length >= 1 &&
							contextItems.map((item, index) => (
								<div
									key={index}
									className="flex items-center gap-1 border border-mochaMauve rounded-md pl-2"
								>
									{item.type === "editor" && (
										<Bars3BottomLeftIcon className="min-w-5 w-5 h-5" />
									)}
									{item.type === "document" && (
										<DocumentTextIcon className="min-w-5 w-5 h-5" />
									)}
									<p className="text-mochaSubtext1 text-xs">{item.label}</p>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => {
											setContextItems((prev) =>
												prev.filter((_, i) => i !== index),
											);
										}}
									>
										<XCircleIcon className="min-w-5 h-5" />
									</Button>
								</div>
							))}
					</div>
				)}

				<Card className="w-full bg-mochaBase border border-mochaMauve flex flex-col p-3 shadow-sm shadow-mochaMauve">
					{quote && (
						<Card className="flex items-start gap-2 bg-mochaMantle border">
							<ArrowTurnDownRightIcon className="min-w-5 h-5 text-mochaText" />
							<p className="text-mochaText text-xs flex-1">{quote}</p>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button variant="ghost" size="icon" onClick={onRemoveQuote}>
										<XCircleIcon className="min-w-5 h-5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>Remove Quote</TooltipContent>
							</Tooltip>
						</Card>
					)}
					<Controller
						control={control}
						name="prompt"
						render={({ field }) => (
							<AutoResizeTextarea
								placeholder="Ask anything"
								className="border-none ring-0 text-mochaText bg-mochaBase"
								onChange={field.onChange}
								value={field.value}
								onKeyDown={handleKeyDown}
							/>
						)}
					/>
					<div className="flex w-full gap-4 justify-between items-center">
						<div className="flex items-center gap-4">
							{/*<ToggleGroup
								type="multiple"
								onValueChange={(value: ChatModes[]) => {
									onToggleChatModes(value);
								}}
								value={chatModes}
							>
								<Tooltip>
									<TooltipTrigger asChild>
										<span>
											<ToggleGroupItem
												value="form-generation-mode"
												variant="outline"
												aria-label="Toggle form generation mode"
												className="rounded-full"
												type="button"
											>
												<ListBulletIcon className="min-w-4 w-4 h-4 mr-2" />
												Form
											</ToggleGroupItem>
										</span>
									</TooltipTrigger>
									<TooltipContent>Form generation tool</TooltipContent>
								</Tooltip>
							</ToggleGroup>*/}
						</div>
						{(status === "submitted" ||
							documentVectorSearchMutationIsPending ||
							status === "streaming" ||
							triggerChatMessagesRuleIsPending) && (
							<Button
								variant="teal"
								onClick={stopStreaming}
								size="icon"
								disabled={false}
							>
								<StopIcon className="min-w-5 w-5 h-5" />
							</Button>
						)}
						{!(
							status === "submitted" ||
							documentVectorSearchMutationIsPending ||
							status === "streaming" ||
							triggerChatMessagesRuleIsPending
						) && (
							<Button
								onClick={handleSubmit(onSentPrompt)}
								size="icon"
								variant="teal"
								disabled={
									createWorkspaceIsPending ||
									triggerChatMessagesRuleIsPending ||
									!watch("prompt").trim()
								}
							>
								<ArrowUpIcon className="min-w-5 w-5 h-5" />
							</Button>
						)}
					</div>
				</Card>
			</div>
		</Card>
	);
};
