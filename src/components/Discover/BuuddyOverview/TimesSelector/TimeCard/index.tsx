import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { BuuddyButton } from "~/components/common/BuuddyButton";
import { Card } from "~/components/ui/card";

export type TimeCardProps = {
	hour: string;
	onSendRequest: (time: string) => void;
};

const TimeCard = ({ hour, onSendRequest }: TimeCardProps) => {
	return (
		<Card className="flex min-w-80 flex-col gap-2 bg-mochaMantle">
			<div className="flex items-center justify-between gap-4">
				<span className="font-bold text-mochaText">{hour}</span>
				<BuuddyButton
					onClick={() => {
						onSendRequest(hour);
					}}
					variant="link"
					endIcon={<PaperAirplaneIcon className="h-5 min-w-5" />}
				>
					Send request
				</BuuddyButton>
			</div>
		</Card>
	);
};

export default TimeCard;
