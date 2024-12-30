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
			<main className="bg-mochaBase flex h-screen w-full flex-col">
				<div className="flex p-4 gap-4 items-center justify-between w-full">
					<SidebarTrigger className="text-mochaLavender min-w-5 h-5" />
					{!session && (
						<Link
							className="text-mochaCrust font-bold bg-mochaMauve pl-4 pr-4 pt-2 pb-2 rounded-md"
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
				<div className="flex h-full w-full flex-col gap-2 rounded-md overflow-hidden">
					<div className="bg-mochaBase flex h-full w-full overflow-hidden rounded-md">
						{children}
					</div>
				</div>
			</main>
		</SidebarProvider>
	);
};

export default Dashboard;
