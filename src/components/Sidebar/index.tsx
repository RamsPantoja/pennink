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
	SidebarRail,
} from "~/components/ui/sidebar";
import {
	ArrowRightStartOnRectangleIcon,
	ChevronUpDownIcon,
	Cog6ToothIcon,
	SquaresPlusIcon,
} from "@heroicons/react/24/outline";
import type { Session } from "next-auth";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import CustomAlertDialog from "../common/AlertDialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import useSidebarLogic from "./useSidebarLogic";
import { useRouter } from "next/router";
import { signOut } from "next-auth/react";
import { mapSkeletons } from "~/lib/utils";
import { Skeleton } from "../ui/skeleton";
import FeedbackMessage from "../common/FeedbackMessage";
import { Fragment } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../common/Button";
import { WorkspaceCard } from "./WorkspaceCard";
import SubscriptionPlansModal from "../SubscriptionPlanSelector";

type AppSidebarProps = {
	session: Session | null;
};

export function AppSidebar({ session }: AppSidebarProps) {
	const router = useRouter();
	const { workspaceId } = router.query;

	const {
		displaySignOutAlert,
		setDisplaySignOutAlert,
		workspacesData,
		workspacesIsLoading,
		workspacesIsError,
		onNewWorkspace,
	} = useSidebarLogic();

	const skeletons = mapSkeletons({
		numberOfSkeletons: 15,
		skeleton: <Skeleton className="w-full rounded-lg h-10" />,
	});

	return (
		<Sidebar collapsible="offcanvas">
			<SidebarHeader>
				<CustomAlertDialog
					cancelText="Cancel"
					actionText="Sign out"
					title="Sign out"
					description={"Warning! Are you sure you want to sign out?"}
					onCancel={() => {
						setDisplaySignOutAlert(false);
					}}
					onAction={() => signOut({ callbackUrl: "/sign-in" })}
					isPending={false}
					open={displaySignOutAlert}
				/>
				{session && (
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<div className="p-1 rounded-md flex w-full flex-row items-center justify-between gap-2 overflow-hidden cursor-pointer hover:bg-mochaMantle">
								<div className="flex flex-row items-center gap-2 min-w-32 w-full">
									<Avatar className="h-7 w-7">
										<AvatarImage src={session.user.image as string} />
										<AvatarFallback>You</AvatarFallback>
									</Avatar>
									<div className="flex flex-col w-full overflow-hidden">
										<p className="truncate text-sm font-bold text-mochaText">
											{session.user.name}
										</p>
										<p className="truncate text-xs text-mochaText">
											{session.user.subscription}
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
									await router.push(`/settings?callbackUrl=${router.asPath}`);
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
							{session.user.subscription === "FREE" && (
								<DropdownMenuItem asChild>
									<SubscriptionPlansModal
										currentSubscription={session.user.subscription}
									/>
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel asChild>
						<div className="flex items-center gap-4 justify-between mb-2">
							<span>Workspaces</span>
							{router.asPath !== "/" && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button onClick={onNewWorkspace} size="icon">
											<SquaresPlusIcon className="min-w-5 w-5 h-5" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>New workspace</TooltipContent>
								</Tooltip>
							)}
						</div>
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{workspacesIsLoading &&
								skeletons.map((skeleton, index) => {
									return <Fragment key={index}>{skeleton}</Fragment>;
								})}
							{!workspacesIsLoading &&
								!workspacesIsError &&
								workspacesData &&
								workspacesData.map((workspace) => {
									return (
										<WorkspaceCard
											key={workspace.id}
											id={workspace.id}
											name={workspace.name}
											selectedWorkspaceId={workspaceId as string}
										/>
									);
								})}
							{!workspacesIsLoading &&
								!workspacesIsError &&
								workspacesData &&
								workspacesData.length === 0 && (
									<div className="p-4">
										<FeedbackMessage
											status="INFORMATION"
											message="No workspaces to show"
										/>
									</div>
								)}
							{!workspacesIsLoading && workspacesIsError && (
								<div className="p-4">
									<FeedbackMessage
										status="ERROR"
										message="Something went wrong!"
									/>
								</div>
							)}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
