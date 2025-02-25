import { PaperClipIcon, StopIcon } from "@heroicons/react/24/outline";
import { Button } from "../common/Button";
import { Card } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ArrowUpIcon } from "lucide-react";
import { useChatLogic } from "./useChatLogic";
import { Input } from "../ui/input";
import { MessageCard } from "./MessageCard";

export const Chat = () => {
	const {
		onSentPrompt,
		useChatForm,
		currentAssistantMessage,
		messages,
		chatIsPending,
	} = useChatLogic({});

	const { register, handleSubmit } = useChatForm;

	return (
		<Card className="flex flex-1 flex-col gap-4 overflow-hidden">
			<div className="flex flex-col gap-4 overflow-auto h-full p-4">
				{messages.map((message) => (
					<MessageCard key={message.id} message={message} />
				))}
				{currentAssistantMessage && (
					<MessageCard message={currentAssistantMessage} />
				)}
			</div>
			<Card className="border-2 w-full bg-white flex flex-col gap-4">
				<Input
					placeholder="Sube un archivo o pega un link de youtube"
					className="resize-none bg-mochaBase"
					{...register("prompt")}
				/>
				<div className="flex w-full gap-4 justify-between items-center">
					<div className="flex items-center gap-4">
						<Tooltip>
							<TooltipTrigger asChild>
								<Button variant="ghost" size="icon">
									<PaperClipIcon className="min-w-5 w-5 h-5" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>Sube archivos y más</TooltipContent>
						</Tooltip>
					</div>
					{chatIsPending && (
						<Button
							onClick={handleSubmit(onSentPrompt)}
							variant="ghost"
							size="icon"
							disabled={false}
						>
							<StopIcon className="min-w-5 w-5 h-5" />
						</Button>
					)}
					{!chatIsPending && (
						<Button
							onClick={handleSubmit(onSentPrompt)}
							variant="ghost"
							size="icon"
							disabled={chatIsPending}
						>
							<ArrowUpIcon className="min-w-5 w-5 h-5" />
						</Button>
					)}
				</div>
			</Card>
		</Card>
	);
};
