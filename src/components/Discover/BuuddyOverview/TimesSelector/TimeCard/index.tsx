import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { BuuddyButton } from "~/components/common/BuuddyButton";
import { Card } from "~/components/ui/card";

export type TimeCardProps = {
  role: string;
  hour: string;
};

const TimeCard = ({ role, hour }: TimeCardProps) => {
  const timeZone = () => {
    console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);
  };

  return (
    <Card className="flex min-w-80 flex-col gap-2 border">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-grayMain">{role}</span>
        <span className="font-bold text-blackMain">{hour}</span>
      </div>
      <div className="flex justify-end">
        <BuuddyButton
          onClick={timeZone}
          endIcon={<PaperAirplaneIcon className="h-5 min-w-5" />}
        >
          Send request
        </BuuddyButton>
      </div>
    </Card>
  );
};

export default TimeCard;
