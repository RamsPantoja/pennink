import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card } from "~/components/ui/card";
import { HeartIcon, StarIcon } from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";

type UserProps = {
    name?: string
}

const UserCard = ({ }: UserProps) => {
    return (
        <a href="/users/313123">
            <Card className=" bg-whiteMain border-2 border-whiteLigth min-w-52 max-w-52 min-h-52">
                <div className="flex flex-col items-center gap-2 overflow-hidden">
                    <Avatar className=" w-14 h-14">
                        <AvatarImage src={"https://lh3.googleusercontent.com/a/ACg8ocJrMSYUN_uZkhM0ETX4N8H9Ffi6qpY7t67KuL8rdm1B-ErUkjjB=s96-c"} />
                        <AvatarFallback>Tú</AvatarFallback>
                    </Avatar>
                    <div className="flex items-center w-full gap-2">
                        <p className="text-blackMain text-lg truncate font-black w-full">Rams Pantoja Cordoba</p>
                        <CheckBadgeIcon className="w-5 h-5 text-pinkStrong" />
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
                        <div className="flex flex-col gap-1">
                            <span className=" text-base font-bold text-blackMain">Tutor de ingles</span>
                            <span className=" text-base font-bold text-pinkStrong">$250 MXN hora</span>
                        </div>
                    </div>
                    {/* <div className="flex w-full flex-col">
                        <span className=" text-grayMain text-sm font-semibold">Información</span>
                        <div className="flex flex-col gap-1">
                            <span className=" text-base font-bold text-blackMain">Mujer</span>
                            <span className=" text-base font-bold text-blackMain">27 años</span>
                            <span className=" text-base font-bold text-blackMain">Uruapan, Michoacan</span>
                        </div>
                    </div> */}
                </div>
            </Card>
        </a>
    )
}

export default UserCard;