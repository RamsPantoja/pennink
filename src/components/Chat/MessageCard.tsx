import type { Message } from "~/server/api/services/aiChat";
import { Card } from "../ui/card";
import { markdownToHtml } from "~/lib/utils";
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
	console.log(message);

	useEffect(() => {
		if (messageContainerRef.current) {
			const html = markdownToHtml(message.content);
			messageContainerRef.current.innerHTML = html;
		}
	}, [message.content]);

	return (
		<Card className="flex flex-col">
			<div
				ref={messageContainerRef}
				className="markdown-styles prismjs-theme"
			/>
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="icon">
					<HandThumbUpIcon className="min-w-5 h-5" />
				</Button>
				<Button variant="ghost" size="icon">
					<HandThumbDownIcon className="min-w-5 h-5" />
				</Button>
			</div>
		</Card>
	);
};
