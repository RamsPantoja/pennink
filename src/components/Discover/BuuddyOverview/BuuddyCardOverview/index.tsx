import { HeartIcon, StarIcon } from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card } from "~/components/ui/card";
import { type RouterOutputs } from "~/utils/api";
import Roles from "../Roles";
import TimesSelector from "../TimesSelector";

type BuuddyCardOverviewProps = {
    buuddyData: RouterOutputs["profile"]["buuddyProfile"]
}

const BuuddyCardOverview = ({ buuddyData }: BuuddyCardOverviewProps) => {
    return (
        <Card className="flex flex-col gap-2 w-full">
            <Card className="flex flex-row gap-4 w-full">
                <Avatar className="w-16 h-16">
                    <AvatarImage src={buuddyData?.user?.image} />
                    <AvatarFallback>Tú</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1 w-full overflow-hidden">
                    <div className="flex items-center gap-2">
                        <p className="text-blackMain text-2xl truncate font-bold">{buuddyData?.user?.name}</p>
                        {
                            buuddyData?.user?.verified &&
                            <CheckBadgeIcon className="min-w-6 h-6 text-pinkStrong" />
                        }
                    </div>
                    <p className="text-blackMain text-base truncate">{buuddyData?.profile.headline}</p>
                    <div className="flex w-fit item-center justify-between gap-4">
                        <div className="flex gap-1 flex-row items-center">
                            <span className="text-sm font-semibold">123</span>
                            <HeartIcon className="w-4 h-4 " />
                        </div>
                        <div className="flex gap-1 flex-row items-center">
                            <span className="text-sm font-semibold">4.3</span>
                            <StarIcon className="w-4 h-4 " />
                        </div>
                    </div>
                </div>
            </Card>
            <Card className="flex w-full h-full gap-2">
                <div className="flex flex-col w-full max-w-screen-sm">
                    <Card>
                        <span className="text-blackMain font-bold">About</span>
                        <p className="text-grayMain text-sm">{buuddyData?.profile.about}</p>
                    </Card>
                    {
                        buuddyData?.profile.experience &&
                        <Card>
                            <span className="text-blackMain font-bold">Experience</span>
                            <p className="text-grayMain text-sm">{buuddyData?.profile.experience}</p>
                        </Card>
                    }
                    <Card className="flex flex-col gap-2">
                        <span className="text-blackMain font-bold">Roles</span>
                        <Roles userId={buuddyData?.user?.id} />
                    </Card>
                </div>
                <div className="flex flex-col w-full gap-2">
                    <span className="text-blackMain font-bold">Booking</span>
                    <TimesSelector
                        userId={buuddyData?.user?.id}
                    />
                </div>
            </Card>
        </Card>
    )
}

export default BuuddyCardOverview;