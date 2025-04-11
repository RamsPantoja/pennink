import { PaperClipIcon, StopIcon } from "@heroicons/react/24/outline";
import { Button } from "../common/Button";
import { Card } from "../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ArrowUpIcon } from "lucide-react";
import { useChatLogic } from "./useChatLogic";
import { Input } from "../ui/input";
import { MessageCard } from "./MessageCard";
import { ChatSkeleton } from "./ChatSkeleton";
import FeedbackMessage from "../common/FeedbackMessage";
import { cn } from "~/lib/utils";
import { ScrollToBottomButton } from "../common/ScrollToBottomButton";

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
		chatIsPending,
		createWorkspaceIsPending,
		messagesIsLoading,
		messagesIsError,
		chatContainer,
	} = useChatLogic({ chatId: id, isNew });

	const { register, handleSubmit, watch } = useChatForm;

	return (
		<Card
			className={cn([
				"flex flex-col gap-4 overflow-hidden relative w-full p-0",
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
					{messages.map((message) => (
						<MessageCard key={message.id} message={message} />
					))}
					{currentAssistantMessage && (
						<MessageCard message={currentAssistantMessage} />
					)}
				</div>
				<ScrollToBottomButton scrollableElementId="chat-container" />
			</div>
			<Card className="w-full bg-mochaBase flex flex-col shadow-md border p-2 border-mochaMauve">
				<Input
					placeholder="Ask anything"
					className="resize-none bg-mochaBase"
					{...register("prompt")}
				/>
				<div className="flex w-full gap-4 justify-between items-center">
					<div className="flex items-center gap-4">
						{/* <Tooltip>
							<TooltipTrigger asChild>
								<Button variant="ghost" size="icon">
									<PaperClipIcon className="min-w-5 w-5 h-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Upload files and more</TooltipContent>
						</Tooltip> */}
					</div>
					{chatIsPending && (
						<Button
							onClick={handleSubmit(onSentPrompt)}
							size="icon"
							disabled={false}
						>
							<StopIcon className="min-w-5 w-5 h-5" />
						</Button>
					)}
					{!chatIsPending && (
						<Button
							onClick={handleSubmit(onSentPrompt)}
							size="icon"
							disabled={
								chatIsPending || createWorkspaceIsPending || !watch("prompt")
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
