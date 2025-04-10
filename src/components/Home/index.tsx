import {
	ArrowUpIcon,
	ArrowUpTrayIcon,
	LinkIcon,
	PaperClipIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../common/Button";
import { Card } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Chat } from "../Chat";
import { typeid } from "typeid-js";

export const HomeComponent = () => {
	const chatId = typeid().toUUID();

	return (
		<div className="flex w-full pl-4 pr-4 pt-0 pb-4 h-full justify-center items-center">
			<Card className="max-w-screen-lg gap-4 flex flex-col w-full justify-center h-full">
				<p className="text-center text-3xl font-bold text-mochaText">
					What can I help with?
				</p>
				<Chat id={chatId} isNew={true} />
				<div className="grid grid-cols-2 gap-4">
					<Card className="border cursor-pointer bg-mochaCrust flex items-center justify-between gap-4 hover:shadow-sm">
						<div className="flex flex-col">
							<p className="text-mochaText">Upload</p>
							<p className="text-xs text-mochaSubText">
								Upload a PDF to start asking anything about the content
							</p>
						</div>
						<ArrowUpTrayIcon className="min-w-5 h-5" />
					</Card>
					<Card className="border cursor-pointer bg-mochaCrust flex items-center justify-between gap-4 hover:shadow-sm">
						<div className="flex flex-col">
							<p className="text-mochaText">Paste</p>
							<p className="text-xs text-mochaSubText">
								Paste a link to a website or a YouTube video to start asking
								anything about it
							</p>
						</div>
						<LinkIcon className="min-w-5 h-5" />
					</Card>
				</div>
			</Card>
		</div>
	);
};
