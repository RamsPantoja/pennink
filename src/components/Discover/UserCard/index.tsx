import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card } from "~/components/ui/card";
import { HeartIcon, StarIcon } from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { type RouterOutputs } from "~/utils/api";
import { useMemo } from "react";

type UserProps = {
  userData: RouterOutputs["user"]["buuddies"][number] | undefined;
};

const UserCard = ({ userData }: UserProps) => {
  const userRole = useMemo(() => {
    if (userData && userData.userRoles.length > 0) {
      return userData.userRoles[0];
    }
  }, [userData]);

  return (
    <a href={`/bd/${userData?.profile?.username}`}>
      <Card className=" min-h-52 min-w-52 max-w-52 border bg-whiteMain">
        <div className="flex flex-col items-center gap-2 overflow-hidden">
          <div className="relative flex flex-col">
            <Avatar className=" h-16 w-16">
              <AvatarImage src={userData?.user.image} />
              <AvatarFallback>Tú</AvatarFallback>
            </Avatar>
            {typeof userData?.user.verified === "boolean" &&
              userData.user.verified && (
                <CheckBadgeIcon className="absolute bottom-0 right-[-0.5em] h-6 w-6 text-pinkStrong" />
              )}
          </div>
          <div className="flex w-full flex-col items-center">
            <p className="w-full truncate font-black text-blackMain">
              {userData?.user.name}
            </p>
            <p className="w-full truncate text-sm text-blackMain">
              {userData?.profile?.headline}
            </p>
          </div>
          <div className="item-center flex w-full justify-between gap-2">
            <div className="flex flex-row items-center gap-1">
              <span className="text-sm font-semibold">123</span>
              <HeartIcon className="h-4 w-4 " />
            </div>
            <div className="flex flex-row items-center gap-1">
              <span className="text-sm font-semibold">4.3</span>
              <StarIcon className="h-4 w-4 " />
            </div>
          </div>
          {userRole && (
            <div className="flex w-full flex-col">
              <span className=" text-sm font-semibold text-blackMain">
                Role
              </span>
              <div className="flex flex-col gap-2">
                <span className=" text-base font-semibold text-grayMain">
                  {userRole.role}
                </span>
                <div className="flex items-center gap-2">
                  <span className=" text-base font-bold">
                    ${userRole.hourPrice} USD
                  </span>
                  <span className="text-sm">hour</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>
    </a>
  );
};

export default UserCard;
