import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card } from "~/components/ui/card";
import { HeartIcon, StarIcon } from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";

type UserProps = {
    name: string | undefined
    verified: boolean | undefined
    image: string | undefined
    username: string | undefined
}

const UserCard = ({ name, verified, image, username }: UserProps) => {
    return (
        <a href={`/bd/${username}`}>
            <Card className=" bg-whiteMain border min-w-52 max-w-52 min-h-52">
                <div className="flex flex-col items-center gap-2 overflow-hidden">
                    <Avatar className=" w-16 h-16">
                        <AvatarImage src={image} />
                        <AvatarFallback>Tú</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center w-full gap-2">
                        <p className="text-blackMain text-lg truncate font-black w-full">{name}</p>
                        {
                            typeof verified === "boolean" && verified &&
                            <CheckBadgeIcon className="w-5 h-5 text-pinkStrong" />
                        }
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
                    <div className="flex w-full flex-col">
                        <span className=" text-grayMain text-sm font-semibold">Role principal</span>
                        <div className="flex flex-col gap-2">
                            <span className=" text-base font-semibold text-blackMain">Tutor de ingles</span>
                            <div className="flex gap-2">
                                <span className=" text-base font-bold">$250 MXN</span>
                                <span className=" text-base">hora</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </a>
    )
}

export default UserCard;