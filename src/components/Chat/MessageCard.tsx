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
	const html = markdownToHtml(message.content);
	const messageContainerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (messageContainerRef.current && html) {
			messageContainerRef.current.innerHTML = html;
		}
	}, [html]);

	return (
		<Card className="flex flex-col">
			<div
				ref={messageContainerRef}
				id="message-content"
				className="flex flex-col"
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
