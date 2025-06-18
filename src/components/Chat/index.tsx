import {
	ArrowTurnDownRightIcon,
	ChatBubbleOvalLeftIcon,
	DocumentTextIcon,
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
		onSentPromptMutationIsPending,
		quote,
		onRemoveQuote,
		onToggleChatModes,
		chatModes,
		document,
		documentVectorSearchMutationIsPending,
		isStreaming,
		stopStreaming,
		handleKeyDown,
		triggerChatMessagesRuleIsPending,
	} = useChatLogic({ chatId: id, isNew });

	const { handleSubmit, watch, control } = useChatForm;

	return (
		<Card
			className={cn([
				"flex flex-col gap-4 overflow-hidden relative w-full p-2 rounded-none bg-transparent",
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
							<ChatBubbleOvalLeftIcon className="min-w-16 h-16" />
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
						<MessageCard message={currentAssistantMessage} />
					)}
				</div>
				<ScrollToBottomButton scrollableElementId="chat-container" />
			</div>
			<Card className="w-full bg-mochaBase flex flex-col p-4 focus:border-mochaMauve shadow-md border">
				{quote && (
					<Card className="flex items-start gap-2 bg-mochaMantle border">
						<ArrowTurnDownRightIcon className="min-w-5 h-5 text-mochaText" />
						<p className="text-mochaText text-xs flex-1">{quote}</p>
						<Tooltip>
							<TooltipTrigger asChild>
								<button
									type="button"
									onClick={onRemoveQuote}
									className="w-fit h-fit"
								>
									<XCircleIcon className="min-w-5 h-5 hover:text-mochaMauve" />
								</button>
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
							className="border-none ring-0 text-mochaMauve"
							onChange={field.onChange}
							value={field.value}
							onKeyDown={handleKeyDown}
						/>
					)}
				/>
				<div className="flex w-full gap-4 justify-between items-center">
					<div className="flex items-center gap-4">
						<ToggleGroup
							type="multiple"
							onValueChange={(value: ChatModes[]) => {
								onToggleChatModes(value);
							}}
							value={chatModes}
						>
							{document && (
								<Tooltip>
									<TooltipTrigger asChild>
										<span>
											<ToggleGroupItem
												value="ask-mode"
												variant="outline"
												aria-label="Toggle ask mode"
												className="rounded-full"
												type="button"
											>
												<DocumentTextIcon className="min-w-4 w-4 h-4 mr-2" />
												Ask content
											</ToggleGroupItem>
										</span>
									</TooltipTrigger>
									<TooltipContent>Ask from content</TooltipContent>
								</Tooltip>
							)}
						</ToggleGroup>
					</div>
					{(onSentPromptMutationIsPending ||
						documentVectorSearchMutationIsPending ||
						isStreaming ||
						triggerChatMessagesRuleIsPending) && (
						<Button onClick={stopStreaming} size="icon" disabled={false}>
							<StopIcon className="min-w-5 w-5 h-5" />
						</Button>
					)}
					{!(
						onSentPromptMutationIsPending ||
						documentVectorSearchMutationIsPending ||
						isStreaming ||
						triggerChatMessagesRuleIsPending
					) && (
						<Button
							onClick={handleSubmit(onSentPrompt)}
							size="icon"
							disabled={
								onSentPromptMutationIsPending ||
								createWorkspaceIsPending ||
								isStreaming ||
								triggerChatMessagesRuleIsPending ||
								!watch("prompt")
							}
						>
							<ArrowUpIcon className="min-w-5 w-5 h-5" />
						</Button>
					)}
				</div>
			</Card>
		</Card>
	);
};
