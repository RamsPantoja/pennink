import {
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { BuuddyButton } from "./BuuddyButton";

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
            <ExclamationCircleIcon className="text-mochaSubText max-h-6 min-h-6 min-w-6 max-w-6" />
            <span className=" text-mochaSubText text-sm">{message}</span>
          </div>
          <BuuddyButton size="sm" variant="link">
            Report error
          </BuuddyButton>
        </div>
      )}
      {status === "SUCCESS" && (
        <div className="flex w-full max-w-96 items-center gap-2">
          <CheckCircleIcon className="max-h-6 min-h-6 min-w-6 max-w-6 text-green-500" />
          <span className=" text-mochaSubText text-sm">{message}</span>
        </div>
      )}
      {status === "WARNING" && (
        <div className="flex w-full max-w-96 items-center gap-2">
          <ExclamationTriangleIcon className="text-mochaSubText max-h-6 min-h-6 min-w-6 max-w-6" />
          <span className=" text-mochaSubText text-sm">{message}</span>
        </div>
      )}
      {status === "INFORMATION" && (
        <div className="flex w-full max-w-96 items-center gap-2">
          <InformationCircleIcon className="text-mochaSubText max-h-6 min-h-6 min-w-6 max-w-6" />
          <span className=" text-mochaSubText text-sm">{message}</span>
        </div>
      )}
    </div>
  );
};

export default FeedbackMessage;
