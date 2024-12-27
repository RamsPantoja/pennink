import type { Session } from "next-auth";
import { AppSidebar } from "~/components/Sidebar";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";

type DashboardProps = {
	session: Session | null;
	children: JSX.Element;
};

const Dashboard = ({ children, session }: DashboardProps) => {
	return (
		<SidebarProvider>
			<AppSidebar session={session} />
			<main className="bg-mochaMantle flex h-screen w-full">
				<div className="flex p-2">
					<SidebarTrigger className="text-mochaMauve min-w-5 h-5" />
				</div>
				<div className="flex h-full w-full">
					<div className="flex h-full w-full flex-col gap-2 rounded-md">
						<div className="bg-mochaBase flex h-full w-full overflow-hidden rounded-md">
							{children}
						</div>
					</div>
				</div>
			</main>
		</SidebarProvider>
	);
};

export default Dashboard;
