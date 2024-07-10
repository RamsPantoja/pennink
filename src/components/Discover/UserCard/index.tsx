import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card } from "~/components/ui/card";
import { HeartIcon, StarIcon } from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { type RouterOutputs } from "~/utils/api";
import { useMemo } from "react";

type UserProps = {
    userData: RouterOutputs["user"]["buuddies"][number] | undefined
}

const UserCard = ({ userData }: UserProps) => {

    const userRole = useMemo(() => {
        if (userData && userData.userRoles.length > 0) {
            return userData.userRoles[0]
        }
    }, [userData]);

    return (
        <a href={`/bd/${userData?.profile?.username}`}>
            <Card className=" bg-whiteMain border min-w-52 max-w-52 min-h-52">
                <div className="flex flex-col items-center gap-2 overflow-hidden">
                    <div className="flex flex-col relative">
                        <Avatar className=" w-16 h-16">
                            <AvatarImage src={userData?.user.image} />
                            <AvatarFallback>Tú</AvatarFallback>
                        </Avatar>
                        {
                            typeof userData?.user.verified === "boolean" && userData.user.verified &&
                            <CheckBadgeIcon className="w-6 h-6 text-pinkStrong absolute bottom-0 right-[-0.5em]" />
                        }
                    </div>
                    <div className="flex items-center w-full gap-2">
                        <p className="text-blackMain text-lg truncate font-black w-full">{userData?.user.name}</p>
                    </div>
                    <div className="flex w-full item-center justify-between gap-2">
                        <div className="flex gap-1 flex-row items-center">
                            <span className="text-sm font-semibold">123</span>
                            <HeartIcon className="w-4 h-4 " />
                        </div>
                        <div className="flex gap-1 flex-row items-center">
                            <span className="text-sm font-semibold">4.3</span>
                            <StarIcon className="w-4 h-4 " />
                        </div>
                    </div>
                    {
                        userRole &&
                        <div className="flex w-full flex-col">
                            <span className=" text-blackMain text-sm font-semibold">Role</span>
                            <div className="flex flex-col gap-2">
                                <span className=" text-base font-semibold text-grayMain">{userRole.role}</span>
                                <div className="flex gap-2">
                                    <span className=" text-base font-bold">${userRole.hourPrice} USD</span>
                                    <span className=" text-base">hour</span>
                                </div>
                            </div>
                        </div>
                    }
                </div>
            </Card>
        </a>
    )
}

export default UserCard;