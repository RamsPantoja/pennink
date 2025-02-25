import { ArrowUpIcon, PaperClipIcon } from "@heroicons/react/24/outline";
import { Button } from "../common/Button";
import { Card } from "../ui/card";
import { Textarea } from "../ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Chat } from "../Chat";

export const HomeComponent = () => {
	return (
		<div className="flex w-full pl-4 pr-4 pt-0 pb-4 h-full justify-center">
			<Card className="max-w-screen-lg w-full gap-8 flex flex-col">
				<p className="text-center text-3xl font-bold">
					¿Que quieres aprender hoy?
				</p>
				<Chat />
			</Card>
		</div>
	);
};
