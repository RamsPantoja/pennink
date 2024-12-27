import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";

import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "~/components/ui/sidebar";
import BuuddyLogotype from "../common/BuuddyLogotype";
import SibedarItem from "./SidebarItem";
import {
	CurrencyDollarIcon,
	PaperAirplaneIcon,
	UserGroupIcon,
	UserIcon,
} from "@heroicons/react/24/outline";
import type { Session } from "next-auth";

type AppSidebarProps = {
	session: Session | null;
};

export function AppSidebar({ session }: AppSidebarProps) {
	return (
		<Sidebar>
			<SidebarHeader>
				<div className="flex items-center gap-2 text-mochaText">
					<BuuddyLogotype />
				</div>
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
											label="Orders"
											href="/payments"
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
		</Sidebar>
	);
}
