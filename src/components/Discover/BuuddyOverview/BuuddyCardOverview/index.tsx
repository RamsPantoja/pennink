import { HeartIcon, StarIcon } from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card } from "~/components/ui/card";
import { type RouterOutputs } from "~/utils/api";

type BuuddyCardOverviewProps = {
  buuddyData: RouterOutputs["profile"]["buuddyProfile"];
};

const BuuddyCardOverview = ({ buuddyData }: BuuddyCardOverviewProps) => {
  return (
    <Card className="flex w-full flex-row gap-4">
      <Avatar className="h-16 w-16">
        <AvatarImage src={buuddyData?.user?.image} />
        <AvatarFallback>Tú</AvatarFallback>
      </Avatar>
      <div className="flex w-full flex-col gap-1 overflow-hidden">
        <div className="flex items-center gap-2">
          <p className="truncate text-2xl font-bold text-blackMain">
            {buuddyData?.user?.name}
          </p>
          {buuddyData?.user?.verified && (
            <CheckBadgeIcon className="h-6 min-w-6 text-pinkStrong" />
          )}
        </div>
        <p className="truncate text-base text-blackMain">
          {buuddyData?.profile.headline}
        </p>
        <div className="item-center flex w-fit justify-between gap-4">
          <div className="flex flex-row items-center gap-1">
            <span className="text-sm font-semibold">123</span>
            <HeartIcon className="h-4 w-4 " />
          </div>
          <div className="flex flex-row items-center gap-1">
            <span className="text-sm font-semibold">4.3</span>
            <StarIcon className="h-4 w-4 " />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default BuuddyCardOverview;
