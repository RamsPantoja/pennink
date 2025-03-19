import type { Message } from "~/server/api/services/chat";
import { Card } from "../ui/card";
import { cn, markdownToHtml } from "~/lib/utils";
import { Button } from "../common/Button";
import {
	HandThumbDownIcon,
	HandThumbUpIcon,
} from "@heroicons/react/24/outline";
import { useRef, useEffect } from "react";

type MessageCardProps = {
	message: Message;
};

export const MessageCard = ({ message }: MessageCardProps) => {
	const messageContainerRef = useRef<HTMLDivElement | null>(null);

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
			<Card
				className={cn([
					"flex flex-col",
					{
						"w-fit": message.role === "AGENT",
						"bg-mochaTeal text-mochaMauve items-end w-fit max-w-screen-sm":
							message.role === "USER",
					},
				])}
			>
				<div
					ref={messageContainerRef}
					className="markdown-styles prismjs-theme flex flex-col"
				/>
				{message.role === "AGENT" && (
					<div className="flex items-center gap-2">
						<Button variant="ghost" size="icon">
							<HandThumbUpIcon className="min-w-5 h-5" />
						</Button>
						<Button variant="ghost" size="icon">
							<HandThumbDownIcon className="min-w-5 h-5" />
						</Button>
					</div>
				)}
			</Card>
		</div>
	);
};
