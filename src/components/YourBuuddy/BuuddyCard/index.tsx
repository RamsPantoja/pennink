import { HeartIcon, StarIcon } from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { type Session } from "next-auth";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card } from "~/components/ui/card";

type ProfileCardProps = {
  session: Session;
};

const BuuddyCard = ({ session }: ProfileCardProps) => {
  return (
    <Card>
      <div className="flex w-full flex-row gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={session.user.image!} />
          <AvatarFallback>Tú</AvatarFallback>
        </Avatar>
        <div className="flex w-full flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <p className="text-mochaText truncate text-2xl font-bold">
              {session.user.name}
            </p>
            <CheckBadgeIcon className="text-mochaMauve h-6 min-w-6" />
          </div>
          <p className="text-mochaText truncate text-base">
            {session.user.email}
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
      </div>
    </Card>
  );
};

export default BuuddyCard;
