import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "~/components/ui/sidebar";
import BuuddyLogotype from "../common/BuuddyLogotype";
import SibedarItem from "./SidebarItem";
import {
	ArrowRightStartOnRectangleIcon,
	ChevronUpDownIcon,
	Cog6ToothIcon,
	CurrencyDollarIcon,
	EllipsisVerticalIcon,
	PaperAirplaneIcon,
	UserGroupIcon,
	UserIcon,
} from "@heroicons/react/24/outline";
import type { Session } from "next-auth";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import CustomAlertDialog from "../common/AlertDialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import Notifications from "../Notifications";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { BuuddyButton } from "../common/BuuddyButton";
import useSidebarLogic from "./useSidebarLogic";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";

type AppSidebarProps = {
	session: Session | null;
};

export function AppSidebar({ session }: AppSidebarProps) {
	const router = useRouter();

	const { displaySignOutAlert, setDisplaySignOutAlert } = useSidebarLogic();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<BuuddyLogotype />
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton className="font-semibold" asChild>
									<SibedarItem
										Icon={UserGroupIcon}
										label="Rent and connect"
										href="/"
									/>
								</SidebarMenuButton>
							</SidebarMenuItem>
							{session && (
								<SidebarMenuItem>
									<SidebarMenuButton className="font-semibold" asChild>
										<SibedarItem
											Icon={PaperAirplaneIcon}
											label="Booking requests"
											href="/booking_requests"
										/>
									</SidebarMenuButton>
								</SidebarMenuItem>
							)}
							{session && (
								<SidebarMenuItem>
									<SidebarMenuButton className="font-semibold" asChild>
										<SibedarItem
											Icon={CurrencyDollarIcon}
											label="Payouts"
											href="/payouts"
										/>
									</SidebarMenuButton>
								</SidebarMenuItem>
							)}
							{session && (
								<SidebarMenuItem>
									<SidebarMenuButton className="font-semibold" asChild>
										<SibedarItem
											Icon={UserIcon}
											label="Your buuddy"
											href="/your_buuddy"
										/>
									</SidebarMenuButton>
								</SidebarMenuItem>
							)}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<CustomAlertDialog
					cancelText="Cancel"
					actionText="Sign out"
					title="Sign out"
					description={"Warning! Are you sure you want to sign out?"}
					onCancel={() => {
						setDisplaySignOutAlert(false);
					}}
					onAction={() => signOut({ callbackUrl: "/sign_in" })}
					isPending={false}
					open={displaySignOutAlert}
				/>
				{session && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<div className="p-1 rounded-md flex w-full flex-row items-center justify-between gap-2 overflow-hidden cursor-pointer hover:bg-mochaMantle">
								<div className="flex flex-row items-center gap-2 min-w-32">
									<Avatar className="h-7 w-7">
										<AvatarImage src={session.user.image!} />
										<AvatarFallback>Tú</AvatarFallback>
									</Avatar>
									<div className="flex flex-col w-full">
										<p className="truncate text-sm font-bold text-mochaText">
											{session.user.name}
										</p>
										<p className="truncate text-xs text-mochaText">
											{session.user.email}
										</p>
									</div>
								</div>
								<ChevronUpDownIcon className="h-5 min-w-5 text-mochaText" />
							</div>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							side="right"
							onCloseAutoFocus={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<DropdownMenuItem
								onSelect={async () => {
									await router.push("/settings");
								}}
							>
								<Cog6ToothIcon className="mr-2 h-5 min-w-5 text-mochaText" />
								Settings
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={() => {
									setDisplaySignOutAlert(true);
								}}
							>
								<ArrowRightStartOnRectangleIcon className="mr-2 h-5 min-w-5 text-mochaText" />
								Sign out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</SidebarFooter>
			<SidebarRail className="bg-mochaBase after:bg-mochaMantle" />
		</Sidebar>
	);
}
