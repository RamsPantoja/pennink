"use client"

import SibedarItem from "./SidebarItem";
import { signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { type Session } from "next-auth";
import CustomAlertDialog from "../common/AlertDialog";
import useSidebarLogic from "./useSidebarLogic";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { CurrencyDollarIcon, UserGroupIcon, UserIcon, EllipsisVerticalIcon, Cog6ToothIcon, PowerIcon } from "@heroicons/react/24/outline";
import { BuuddyButton } from "../common/BuuddyButton";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";

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
            <div className="flex items-center gap-2">
                <div className="h-6 m-w-6">
                    <svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                        width="100%" height="100%" viewBox="0 0 500 500" enableBackground="new 0 0 500 500" xmlSpace="preserve">
                        <path fill="#FFFFFF" opacity="1.000000" stroke="none"
                            d="
M501.000000,194.000000 
	C501.000000,296.666656 501.000000,398.833282 501.000000,500.999939 
	C334.333405,500.999969 167.666794,500.999969 1.000144,501.000000 
	C1.000096,334.333435 1.000096,167.666870 1.000048,1.000234 
	C167.666519,1.000156 334.333038,1.000156 500.999786,1.000078 
	C501.000000,65.166664 501.000000,129.333328 501.000000,194.000000 
M208.558182,478.005219 
	C244.703873,485.116394 280.425079,483.466797 315.446014,471.959595 
	C367.876587,454.731934 407.776733,421.859894 434.851166,373.843292 
	C451.897614,343.611359 461.026611,310.928589 461.112335,276.096527 
	C461.283386,206.610748 461.194183,137.123978 461.054169,67.637939 
	C461.001373,41.428879 439.348877,20.180870 413.115570,20.117413 
	C387.783905,20.056135 366.081207,41.454296 365.923553,66.694916 
	C365.865723,75.950027 365.914246,85.205803 365.914246,94.704552 
	C289.115723,50.045288 212.866852,50.000057 136.099136,94.548958 
	C136.099136,85.441597 135.838913,76.663506 136.151001,67.905807 
	C136.899200,46.910572 119.233894,21.229013 89.383461,20.152840 
	C63.615223,19.223839 40.975304,41.041489 40.937233,66.933311 
	C40.836044,135.752808 40.698021,204.572968 40.941971,273.391571 
	C40.983620,285.141052 41.979977,297.034607 44.004696,308.604431 
	C53.399258,362.287689 80.243721,405.684845 123.157730,439.025543 
	C148.242432,458.514313 176.650757,471.209229 208.558182,478.005219 
z"/>
                        <path fill="#fa23b6" opacity="1.000000" stroke="none"
                            d="
M208.137299,477.957458 
	C176.650757,471.209229 148.242432,458.514313 123.157730,439.025543 
	C80.243721,405.684845 53.399258,362.287689 44.004696,308.604431 
	C41.979977,297.034607 40.983620,285.141052 40.941971,273.391571 
	C40.698021,204.572968 40.836044,135.752808 40.937233,66.933311 
	C40.975304,41.041489 63.615223,19.223839 89.383461,20.152840 
	C119.233894,21.229013 136.899200,46.910572 136.151001,67.905807 
	C135.838913,76.663506 136.099136,85.441597 136.099136,94.548958 
	C212.866852,50.000057 289.115723,50.045288 365.914246,94.704552 
	C365.914246,85.205803 365.865723,75.950027 365.923553,66.694916 
	C366.081207,41.454296 387.783905,20.056135 413.115570,20.117413 
	C439.348877,20.180870 461.001373,41.428879 461.054169,67.637939 
	C461.194183,137.123978 461.283386,206.610748 461.112335,276.096527 
	C461.026611,310.928589 451.897614,343.611359 434.851166,373.843292 
	C407.776733,421.859894 367.876587,454.731934 315.446014,471.959595 
	C280.425079,483.466797 244.703873,485.116394 208.137299,477.957458 
M275.976593,374.552856 
	C328.549347,361.622742 363.355499,311.296326 355.758728,257.564636 
	C348.841248,208.637512 310.265717,170.716400 261.757690,166.319382 
	C225.726273,163.053299 194.886337,174.948303 170.817856,202.529938 
	C134.892212,243.699493 136.357498,306.238403 174.659302,345.104675 
	C202.486221,373.341675 236.329086,382.999573 275.976593,374.552856 
z"/>
                        <path fill="#FFFFFF" opacity="1.000000" stroke="none"
                            d="
M275.580261,374.679962 
	C236.329086,382.999573 202.486221,373.341675 174.659302,345.104675 
	C136.357498,306.238403 134.892212,243.699493 170.817856,202.529938 
	C194.886337,174.948303 225.726273,163.053299 261.757690,166.319382 
	C310.265717,170.716400 348.841248,208.637512 355.758728,257.564636 
	C363.355499,311.296326 328.549347,361.622742 275.580261,374.679962 
z"/>
                    </svg>
                </div>
                <p className="font-black text-2xl">buuddy</p>
            </div>
            <ul className="flex flex-col w-full h-full">
                <SibedarItem
                    Icon={UserGroupIcon}
                    label="Rentar"
                    href="/"
                />
                {/* <SibedarItem
                    Icon={CalendarIcon}
                    label="Eventos"
                    href="/events"
                /> */}
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
                        <DropdownMenu>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <DropdownMenuTrigger asChild>
                                        <BuuddyButton size="icon" startIcon={<EllipsisVerticalIcon className="h-5 min-w-5 text-blackMain" />} variant='ghost'>{""}</BuuddyButton>
                                    </DropdownMenuTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="text-whiteMain">Más opciones</p>
                                </TooltipContent>
                            </Tooltip>
                            <DropdownMenuContent
                                onCloseAutoFocus={(e) => {
                                    e.preventDefault();
                                }}
                            >
                                <DropdownMenuItem
                                    onSelect={() => {
                                        console.log("Settings")
                                    }}
                                >
                                    <Cog6ToothIcon className="mr-2 h-5 min-w-5 text-blackMain" />
                                    Configuración
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => {
                                        setDisplaySignOutAlert(true);
                                    }}
                                >
                                    <PowerIcon className="mr-2 h-5 min-w-5 text-blackMain" />
                                    Cerrar sesión
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
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