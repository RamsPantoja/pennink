import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { BuuddyButton } from "~/components/common/BuuddyButton";
import { Card } from "~/components/ui/card";

export type TimeCardProps = {
  hour: string;
};

const TimeCard = ({ hour }: TimeCardProps) => {
  return (
    <Card className="bg-mochaMantle flex min-w-80 flex-col gap-2">
      <div className="flex items-center justify-between gap-4">
        <span className="text-mochaText font-bold">{hour}</span>
        <BuuddyButton
          onClick={() => {
            console.log("clicked");
          }}
          variant="outline"
          endIcon={<PaperAirplaneIcon className="h-5 min-w-5" />}
        >
          Send request
        </BuuddyButton>
      </div>
    </Card>
  );
};

export default TimeCard;
