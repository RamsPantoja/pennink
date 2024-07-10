import { HeartIcon, StarIcon } from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { type Session } from "next-auth";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card } from "~/components/ui/card";

type ProfileCardProps = {
    session: Session
}

const BuuddyCard = ({ session }: ProfileCardProps) => {
    return (
        <Card>
            <div className="flex flex-row gap-4 w-full">
                <Avatar className="w-16 h-16">
                    <AvatarImage src={session.user.image!} />
                    <AvatarFallback>Tú</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-1 w-full overflow-hidden">
                    <div className="flex items-center gap-2">
                        <p className="text-blackMain text-2xl truncate font-bold">{session.user.name}</p>
                        <CheckBadgeIcon className="min-w-6 h-6 text-pinkStrong" />
                    </div>
                    <p className="text-blackMain text-base truncate">{session.user.email}</p>
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
            </div>
        </Card>
    )
}

export default BuuddyCard;