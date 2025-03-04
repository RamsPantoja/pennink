import type { Session } from "next-auth";
import Link from "next/link";
import Notifications from "~/components/Notifications";
import { AppSidebar } from "~/components/Sidebar";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "~/components/ui/tooltip";

type DashboardProps = {
	session: Session | null;
	children: JSX.Element;
};

const Dashboard = ({ children, session }: DashboardProps) => {
	return (
		<SidebarProvider>
			<AppSidebar session={session} />
			<main className="bg-mochaBase flex h-screen w-full flex-col overflow-hidden pl-2">
				<div className="flex p-2 gap-4 items-center justify-between w-full">
					<SidebarTrigger />
					<div className="flex items-center gap-4">
						{!session && (
							<Link
								className="text-mochaCrust font-bold bg-mochaMauve pl-4 pr-4 pt-2 pb-2 rounded-full"
								href="/sign_in"
							>
								Sign in
							</Link>
						)}
						{session && (
							<Tooltip>
								<TooltipTrigger asChild>
									<span>
										<Notifications session={session} />
									</span>
								</TooltipTrigger>
								<TooltipContent>Notifications</TooltipContent>
							</Tooltip>
						)}
					</div>
				</div>
				<div className="flex w-full h-full gap-2 rounded-md overflow-hidden pl-2 pr-2 pb-2">
					{children}
				</div>
			</main>
		</SidebarProvider>
	);
};

export default Dashboard;
