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
import { signOut } from "next-auth/react";
import { mapSkeletons } from "~/lib/utils";
import { Skeleton } from "../ui/skeleton";
import FeedbackMessage from "../common/FeedbackMessage";
import { Fragment } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../common/Button";
import { WorkspaceCard } from "./WorkspaceCard";
import SubscriptionPlansModal from "../SubscriptionPlanSelector";
import { UsageService } from "../UsageService";
import { useParams, useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

type AppSidebarProps = {
	session: Session | null;
};

export function AppSidebar({ session }: AppSidebarProps) {
	const t = useTranslations("AppSidebar");
	const router = useRouter();
	const pathname = usePathname();
	const params = useParams();

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
					cancelText={t("signOutDialog.cancel")}
					actionText={t("signOutDialog.confirm")}
					title={t("signOutDialog.title")}
					description={t("signOutDialog.description")}
					onCancel={() => {
						setDisplaySignOutAlert(false);
					}}
					onAction={() => signOut({ callbackUrl: "/sign-in" })}
					isPending={false}
					open={displaySignOutAlert}
				/>
				{session && (
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger asChild>
							<div className="p-1 rounded-md flex w-full flex-row items-center justify-between gap-2 overflow-hidden cursor-pointer hover:bg-light-mocha-mantle dark:hover:bg-mocha-mantle">
								<div className="flex flex-row items-center gap-2 min-w-32 w-full text-light-mocha-text dark:text-mocha-text">
									<Avatar className="h-7 w-7">
										<AvatarImage src={session.user.image as string} />
										<AvatarFallback>{t("user.avatarFallback")}</AvatarFallback>
									</Avatar>
									<div className="flex flex-col w-full overflow-hidden">
										<p className="truncate text-sm font-bold">
											{session.user.name}
										</p>
										<p className="truncate text-xs">
											{t(
												`subscriptions.${session.user.subscription.toLowerCase()}`,
											)}
										</p>
									</div>
								</div>
								<ChevronUpDownIcon className="h-5 min-w-5" />
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
									router.push(`/settings?callbackUrl=${pathname}`);
								}}
							>
								<Cog6ToothIcon className="mr-2 h-5 min-w-5 text-mocha-text" />
								{t("menu.settings")}
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={() => {
									setDisplaySignOutAlert(true);
								}}
							>
								<ArrowRightStartOnRectangleIcon className="mr-2 h-5 min-w-5 text-mocha-text" />
								{t("menu.signOut")}
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
				<SidebarGroup className="overflow-hidden">
					<SidebarGroupLabel asChild>
						<div className="flex items-center gap-4 justify-between mb-2">
							<span>{t("workspaces.title")}</span>
							{pathname !== "/" && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button onClick={onNewWorkspace} size="icon">
											<SquaresPlusIcon className="min-w-5 w-5 h-5" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>{t("tooltips.newWorkspace")}</TooltipContent>
								</Tooltip>
							)}
						</div>
					</SidebarGroupLabel>
					<SidebarGroupContent className="overflow-auto p-1">
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
											selectedWorkspaceId={params?.workspaceId as string}
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
											message={t("workspaces.empty")}
										/>
									</div>
								)}
							{!workspacesIsLoading && workspacesIsError && (
								<div className="p-4">
									<FeedbackMessage
										status="ERROR"
										message={t("workspaces.error")}
									/>
								</div>
							)}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			{session?.user.subscription === "FREE" && (
				<SidebarFooter>
					<UsageService />
				</SidebarFooter>
			)}
		</Sidebar>
	);
}
