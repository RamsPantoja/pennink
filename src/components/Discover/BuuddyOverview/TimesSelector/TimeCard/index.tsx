import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { BuuddyButton } from "~/components/common/BuuddyButton";
import { Card } from "~/components/ui/card";
import {
	convert24HourNumberToHHMMFormat,
	convertTo12HourFormat,
} from "~/lib/utils";

export type TimeCardProps = {
	hour: number;

	onSendRequest: (time: string) => void;
};

const TimeCard = ({ hour, onSendRequest }: TimeCardProps) => {
	return (
		<Card className="flex min-w-80 flex-col gap-2 bg-mochaMantle">
			<div className="flex items-center justify-between gap-4">
				<span className="font-bold text-mochaText">
					{convertTo12HourFormat(hour)}
				</span>
				<BuuddyButton
					onClick={() => {
						onSendRequest(convert24HourNumberToHHMMFormat(hour));
					}}
					endIcon={<PaperAirplaneIcon className="h-5 min-w-5" />}
				>
					Send request
				</BuuddyButton>
			</div>
		</Card>
	);
};

export default TimeCard;
