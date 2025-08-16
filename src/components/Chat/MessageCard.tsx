import type { Message } from "~/server/api/services/chat";
import { Card } from "../ui/card";
import { cn } from "~/lib/utils";
import { ArrowTurnDownRightIcon } from "@heroicons/react/24/outline";
import { Fragment } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { DateTime } from "luxon";
import { Response } from "../ai-elements/response";
import {
	Reasoning,
	ReasoningContent,
	ReasoningTrigger,
} from "../ai-elements/reasoning";

type MessageCardProps = {
	message: Message;
	isStreaming?: boolean;
};

export const MessageCard = ({ message, isStreaming }: MessageCardProps) => {
	const { data } = useSession();

	return (
		<div className={cn(["flex flex-col"])}>
			{message.quote && (
				<Card className="flex items-start gap-2 border border-mochaMauve mb-2">
					<ArrowTurnDownRightIcon className="min-w-5 h-5" />
					<p className="text-sm flex-1 italic text-mochaText">
						{message.quote}
					</p>
				</Card>
			)}
			<Card
				className={cn([
					"flex flex-col",
					{
						"w-fit bg-transparent": message.role === "assistant",
						"bg-mochaMauve text-mochaText relative": message.role === "user",
					},
				])}
			>
				{message.role === "user" && data && (
					<div className="absolute top-[-4px] right-0 z-10">
						<Avatar className="h-5 w-5 border">
							<AvatarImage src={data.user.image as string} />
							<AvatarFallback>You</AvatarFallback>
						</Avatar>
					</div>
				)}
				{message.parts.length > 0 ? (
					<Fragment>
						{message.parts.map((part, i) => {
							switch (part.type) {
								case "text":
									return (
										<Response key={`${message.id}-${i}`} content={part.text} />
									);
								case "reasoning":
									return (
										<Reasoning
											key={`${message.id}-${i}`}
											className="w-full"
											isStreaming={isStreaming}
										>
											<ReasoningTrigger />
											<ReasoningContent content={part.reasoning} />
										</Reasoning>
									);
							}
						})}
					</Fragment>
				) : (
					<Response content={message.content} />
				)}

				<span className="text-xs text-mochaSubtext1">
					{DateTime.fromJSDate(message.createdAt).toLocaleString(
						DateTime.DATETIME_MED,
					)}
				</span>
			</Card>
		</div>
	);
};
