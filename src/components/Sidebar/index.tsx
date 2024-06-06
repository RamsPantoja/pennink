"use client"


import SibedarItem from "./SidebarItem";
import { signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { type Session } from "next-auth";
import CustomAlertDialog from "../common/AlertDialog";
import useSidebarLogic from "./useSidebarLogic";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { ArrowLeftEndOnRectangleIcon, CurrencyDollarIcon, UserGroupIcon, UserIcon } from "@heroicons/react/24/outline";

type SidebarProps = {
    session?: Session
}

const Sidebar = ({ }: SidebarProps) => {
    const {
        displaySignOutAlert,
        setDisplaySignOutAlert
    } = useSidebarLogic();

    return (
        <TooltipProvider delayDuration={200}>
            <nav className="flex w-full h-full flex-col gap-4">
                <p className="font-black text-xl">buuddy.io</p>
                <ul className="flex flex-col w-full h-full">
                    <SibedarItem
                        Icon={UserGroupIcon}
                        label="Descubrir"
                        href="/"
                    />
                    <SibedarItem
                        Icon={CurrencyDollarIcon}
                        label="Balance"
                        href="/balance"
                    />
                    <SibedarItem
                        Icon={UserIcon}
                        label="Perfil"
                        href="/profile"
                    />
                </ul>
                <div className="flex flex-row gap-2 justify-between items-center w-full">
                    <div className="flex flex-row items-center gap-2 overflow-hidden">
                        <Avatar className=" w-7 h-7">
                            <AvatarImage src={"https://lh3.googleusercontent.com/a/ACg8ocJrMSYUN_uZkhM0ETX4N8H9Ffi6qpY7t67KuL8rdm1B-ErUkjjB=s96-c"} />
                            <AvatarFallback>Tú</AvatarFallback>
                        </Avatar>
                        <p className="text-blackMain text-xs truncate font-bold">Rams Pantoja</p>
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
                                    <ArrowLeftEndOnRectangleIcon className="w-4 h-4 text-blackMain" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent className=" bg-blackMain border-none max-w-60">
                                <p className="text-whiteMain">Cerrar sesión</p>
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
            </nav>
        </TooltipProvider>
    )
}

export default Sidebar;