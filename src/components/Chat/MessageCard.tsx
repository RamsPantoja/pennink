import type { Message } from "~/server/api/services/chat";
import { Card } from "../ui/card";
import { cn, markdownToHtml } from "~/lib/utils";
import { Button } from "../common/Button";
import {
	ArrowTurnDownRightIcon,
	HandThumbDownIcon,
	HandThumbUpIcon,
} from "@heroicons/react/24/outline";
import { useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

type MessageCardProps = {
	message: Message;
};

export const MessageCard = ({ message }: MessageCardProps) => {
	const messageContainerRef = useRef<HTMLDivElement | null>(null);
	const { data } = useSession();

	useEffect(() => {
		if (messageContainerRef.current) {
			const html = markdownToHtml(message.content);
			messageContainerRef.current.innerHTML = html;
		}
	}, [message.content]);

	return (
		<div
			className={cn([
				"flex flex-col",
				{
					"items-start": message.role === "AGENT",
					"items-end": message.role === "USER",
				},
			])}
		>
			{message.quote && (
				<Card className="flex items-start gap-2 border mb-2">
					<ArrowTurnDownRightIcon className="min-w-5 h-5" />
					<p className="text-sm flex-1 italic text-mochaMauve">
						{message.quote}
					</p>
				</Card>
			)}
			<Card
				className={cn([
					"flex flex-col",
					{
						"w-fit bg-transparent": message.role === "AGENT",
						"bg-mochaMantle text-mochaMauve items-end w-fit max-w-screen-sm relative":
							message.role === "USER",
					},
				])}
			>
				{message.role === "USER" && data && (
					<div className="absolute top-[-4px] right-0">
						<Avatar className="h-5 w-5 border">
							<AvatarImage src={data.user.image as string} />
							<AvatarFallback>You</AvatarFallback>
						</Avatar>
					</div>
				)}
				<div
					ref={messageContainerRef}
					className={cn([
						"flex flex-col",
						{
							"markdown-styles prismjs-theme": message.role === "AGENT",
						},
					])}
				/>
			</Card>
		</div>
	);
};
