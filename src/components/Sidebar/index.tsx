import {
	ArrowRightStartOnRectangleIcon,
	ChevronUpDownIcon,
	ClipboardDocumentListIcon,
	Cog6ToothIcon,
	DocumentIcon,
	SquaresPlusIcon,
} from "@heroicons/react/24/outline";
import { ClipboardList, FileText, GitBranch } from "lucide-react";
import type { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";
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
import { mapSkeletons } from "~/lib/utils";
import { SettingsDialog } from "../Settings/SettingsDialog";
import SubscriptionPlansModal from "../SubscriptionPlanSelector";
import { UsageService } from "../UsageService";
import CustomAlertDialog from "../common/AlertDialog";
import FeedbackMessage from "../common/FeedbackMessage";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Skeleton } from "../ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ClassroomSection } from "./ClassroomSection";
import useSidebarLogic from "./useSidebarLogic";

type AppSidebarProps = {
	session: Session | null;
	onOpenPlanArtifacts?: () => void;
};

export function AppSidebar({ session, onOpenPlanArtifacts }: AppSidebarProps) {
	const t = useTranslations("AppSidebar");
	const router = useRouter();
	const pathname = usePathname();
	const [displaySettings, setDisplaySettings] = useState(false);

	const {
		displaySignOutAlert,
		setDisplaySignOutAlert,
		classroomsData,
		classroomsIsLoading,
		classroomsIsError,
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
					<SettingsDialog
						open={displaySettings}
						onOpenChange={setDisplaySettings}
						session={session}
					/>
				)}
				{session && (
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger asChild>
							<div className="p-1 rounded-md flex w-full flex-row items-center justify-between gap-2 overflow-hidden cursor-pointer hover:bg-muted dark:hover:bg-muted">
								<div className="flex flex-row items-center gap-2 min-w-32 w-full text-foreground dark:text-foreground">
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
								onSelect={() => {
									setDisplaySettings(true);
								}}
							>
								<Cog6ToothIcon className="mr-2 h-5 min-w-5 text-foreground" />
								{t("menu.settings")}
							</DropdownMenuItem>
							<DropdownMenuItem
								onSelect={() => {
									setDisplaySignOutAlert(true);
								}}
							>
								<ArrowRightStartOnRectangleIcon className="mr-2 h-5 min-w-5 text-foreground" />
								{t("menu.signOut")}
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				)}
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent className="p-1">
						<SidebarMenu>
							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={pathname === "/study-plans"}
									onClick={() => router.push("/study-plans")}
								>
									<GitBranch className="h-5 min-w-5 text-foreground" />
									<span>{t("studyPlans.manage")}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
							<SidebarMenuItem>
								<SidebarMenuButton
									isActive={pathname === "/evaluate-exams"}
									onClick={() => router.push("/evaluate-exams")}
								>
									<ClipboardList className="h-5 min-w-5 text-foreground" />
									<span>{t("evaluateExams.manage")}</span>
								</SidebarMenuButton>
							</SidebarMenuItem>
							{onOpenPlanArtifacts && (
								<SidebarMenuItem>
									<SidebarMenuButton onClick={() => onOpenPlanArtifacts()}>
										<FileText className="h-5 min-w-5 text-foreground" />
										<span>{t("planArtifacts.manage")}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							)}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
				<SidebarGroup className="overflow-hidden">
					<SidebarGroupLabel asChild>
						<div className="flex items-center gap-4 justify-between mb-2">
							<span>{t("classrooms.title")}</span>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button onClick={onNewWorkspace} variant="ghost" size="icon">
										<SquaresPlusIcon className="min-w-5 w-5 h-5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>{t("tooltips.newWorkspace")}</TooltipContent>
							</Tooltip>
						</div>
					</SidebarGroupLabel>
					<SidebarGroupContent className="overflow-auto p-1">
						<SidebarMenu>
							{classroomsIsLoading &&
								skeletons.map((skeleton, index) => {
									return <Fragment key={index}>{skeleton}</Fragment>;
								})}
							{!classroomsIsLoading &&
								!classroomsIsError &&
								classroomsData &&
								classroomsData.map((classroom) => (
									<ClassroomSection
										key={classroom.id}
										id={classroom.id}
										name={classroom.name}
									/>
								))}
							{!classroomsIsLoading &&
								!classroomsIsError &&
								classroomsData &&
								classroomsData.length === 0 && (
									<div className="p-4">
										<FeedbackMessage
											status="INFORMATION"
											message={t("classrooms.empty")}
										/>
									</div>
								)}
							{!classroomsIsLoading && classroomsIsError && (
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
					<SubscriptionPlansModal
						currentSubscription={session.user.subscription}
					/>
				</SidebarFooter>
			)}
		</Sidebar>
	);
}
