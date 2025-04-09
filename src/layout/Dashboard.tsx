import {
	ArrowUpTrayIcon,
	DocumentPlusIcon,
	MagnifyingGlassIcon,
	SquaresPlusIcon,
} from "@heroicons/react/24/outline";
import type { Session } from "next-auth";
import { cookies } from "next/headers";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState, type ReactNode } from "react";
import Notifications from "~/components/Notifications";
import { AppSidebar } from "~/components/Sidebar";
import { DocumentLoader } from "~/components/Workspace/DocumentLoader";
import { useWorkspaceStore } from "~/components/Workspace/useWorkspaceStore";
import { Button } from "~/components/common/Button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "~/components/ui/tooltip";

type DashboardProps = {
	session: Session | null;
	children: ReactNode;
};

const Dashboard = ({ children, session }: DashboardProps) => {
	const [openDocumentLoader, setOpenDocumentLoader] = useState<boolean>(false);
	const { setDocument } = useWorkspaceStore();
	const router = useRouter();
	const onNewWorkspace = () => {
		router.push("/");
	};

	return (
		<SidebarProvider>
			<AppSidebar session={session} />
			<DocumentLoader
				onSelect={(doc) => {
					setDocument(doc);
					setOpenDocumentLoader(false);
				}}
				open={openDocumentLoader}
				onOpenChange={setOpenDocumentLoader}
			/>
			<main className="bg-mochaBase flex h-screen w-full flex-col overflow-hidden">
				<div className="flex p-1 gap-4 items-center justify-between w-full border border-l-0">
					<SidebarTrigger className="min-w-8 h-8">
						<span>Toggle</span>
					</SidebarTrigger>
					<div className="flex items-center gap-2">
						{router.asPath !== "/" && (
							<DropdownMenu>
								<Tooltip>
									<TooltipTrigger asChild>
										<DropdownMenuTrigger asChild>
											<Button variant="default" size="icon">
												<DocumentPlusIcon className="min-w-5 w-5 h-5" />
											</Button>
										</DropdownMenuTrigger>
									</TooltipTrigger>
									<TooltipContent>Load new document</TooltipContent>
								</Tooltip>
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
										className="flex gap-2"
									>
										<ArrowUpTrayIcon className="min-w-5 w-5 h-5" />
										Upload
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={() => {
											setOpenDocumentLoader(true);
										}}
										className="flex gap-2"
									>
										<MagnifyingGlassIcon className="min-w-5 w-5 h-5" />
										Search
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}

						{router.asPath !== "/" && (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										onClick={onNewWorkspace}
										variant="default"
										size="icon"
									>
										<SquaresPlusIcon className="min-w-5 w-5 h-5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>New workspace</TooltipContent>
							</Tooltip>
						)}
					</div>

					{/* <div className="flex items-center gap-4">
						{!session && (
							<Link
								className="text-mochaCrust font-bold bg-mochaMauve pl-4 pr-4 pt-2 pb-2 rounded-full"
								href="/sign-in"
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
					</div> */}
				</div>
				<div className="flex w-full h-full gap-2 rounded-md overflow-hidden">
					{children}
				</div>
			</main>
		</SidebarProvider>
	);
};

export default Dashboard;
