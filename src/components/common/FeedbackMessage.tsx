import {
	InformationCircleIcon,
	CheckCircleIcon,
	ExclamationTriangleIcon,
	ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "./Button";

type FeedbackMessageProps = {
	message: string;
	status: "SUCCESS" | "ERROR" | "WARNING" | "INFORMATION";
};

const FeedbackMessage = ({ message, status }: FeedbackMessageProps) => {
	return (
		<div className="flex h-full w-full items-center justify-center">
			{status === "ERROR" && (
				<div className="flex w-full max-w-96 flex-col items-center gap-2">
					<div className="flex items-center gap-2">
						<ExclamationCircleIcon className="text-mochaSubText max-h-5 min-h-5 min-w-5 max-w-5" />
						<span className=" text-mochaSubText text-sm">{message}</span>
					</div>
					<Button size="sm" variant="link">
						Report error
					</Button>
				</div>
			)}
			{status === "SUCCESS" && (
				<div className="flex w-full max-w-96 items-center gap-2">
					<CheckCircleIcon className="max-h-5 min-h-5 min-w-5 max-w-5 text-green-500" />
					<span className=" text-mochaSubText text-sm">{message}</span>
				</div>
			)}
			{status === "WARNING" && (
				<div className="flex w-full max-w-96 items-center gap-2">
					<ExclamationTriangleIcon className="text-mochaSubText max-h-5 min-h-5 min-w-5 max-w-5" />
					<span className=" text-mochaSubText text-sm">{message}</span>
				</div>
			)}
			{status === "INFORMATION" && (
				<div className="flex w-full max-w-96 items-center gap-2">
					<InformationCircleIcon className="text-mochaSubText max-h-5 min-h-5 min-w-5 max-w-5" />
					<span className=" text-mochaSubText text-sm">{message}</span>
				</div>
			)}
		</div>
	);
};

export default FeedbackMessage;
