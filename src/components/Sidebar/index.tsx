"use client"

import SibedarItem from "./SidebarItem";
import { signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { type Session } from "next-auth";
import CustomAlertDialog from "../common/AlertDialog";
import useSidebarLogic from "./useSidebarLogic";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { CalendarIcon, CurrencyDollarIcon, UserGroupIcon, UserIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { BuuddyButton } from "../common/BuuddyButton";
import { useRouter } from "next/navigation";

type SidebarProps = {
    session: Session | null
}

const Sidebar = ({ session }: SidebarProps) => {
    const router = useRouter();

    const {
        displaySignOutAlert,
        setDisplaySignOutAlert
    } = useSidebarLogic();

    return (
        <nav className="flex w-full h-full flex-col gap-4">
            <p className="font-black text-2xl">Buuddy</p>
            <ul className="flex flex-col w-full h-full">
                <SibedarItem
                    Icon={UserGroupIcon}
                    label="Rentar"
                    href="/"
                />
                <SibedarItem
                    Icon={CalendarIcon}
                    label="Eventos"
                    href="/events"
                />
                {
                    session &&
                    <SibedarItem
                        Icon={CurrencyDollarIcon}
                        label="Balance"
                        href="/balance"
                    />
                }
                {
                    session &&
                    <SibedarItem
                        Icon={UserIcon}
                        label="Tu buuddy"
                        href="/your_buuddy"
                    />
                }
            </ul>
            {
                session &&
                <div className="flex flex-row gap-2 justify-between items-center w-full">
                    <div className="flex flex-row items-center gap-2 overflow-hidden">
                        <Avatar className=" w-7 h-7">
                            <AvatarImage src={session.user.image!} />
                            <AvatarFallback>Tú</AvatarFallback>
                        </Avatar>
                        <p className="text-blackMain text-xs truncate font-bold">{session.user.name}</p>
                    </div>
                    <div className="flex items-center">
                        <CustomAlertDialog
                            cancelText="Cancelar"
                            actionText="Confirmar"
                            title="Cerrar sesión"
                            description={"¡Atención! ¿Estás seguro de que quieres cerrar sesión?"}
                            onCancel={() => {
                                setDisplaySignOutAlert(false);
                            }}
                            onAction={() => signOut({ callbackUrl: '/sign_in' })}
                            isPending={false}
                            open={displaySignOutAlert}
                        />
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    className=" h-8 m-w-8 p-0"
                                    variant='ghost'
                                    size='icon'
                                    onClick={() => {
                                        setDisplaySignOutAlert(true);
                                    }}
                                >
                                    <EllipsisVerticalIcon className="min-w-5 h-5 text-blackMain" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className=" bg-blackMain border-none max-w-60">
                                <p className="text-whiteMain">Opciones de cuenta</p>
                            </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span>
                                    {/* <Notifications session={session} /> */}
                                </span>
                            </TooltipTrigger>
                            <TooltipContent className=" bg-blackMain border-none max-w-60">
                                <p className="text-whiteMain">Notificaciones</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            }
            {
                !session &&
                <div className="flex flex-row gap-2 justify-between items-center w-full">
                    <BuuddyButton
                        variant="secondary"
                        className="w-full"
                        onClick={() => { router.push('/sign_in') }}
                    >
                        Iniciar sesión
                    </BuuddyButton>
                </div>
            }
        </nav>
    )
}

export default Sidebar;