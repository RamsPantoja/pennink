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
				<div className="flex w-full h-full gap-2 rounded-md overflow-hidden">
					{children}
				</div>
			</main>
		</SidebarProvider>
	);
};

export default Dashboard;
