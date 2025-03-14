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
	DocumentPlusIcon,
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
import { NotebookCard } from "./NotebookCard";

type AppSidebarProps = {
	session: Session | null;
};

export function AppSidebar({ session }: AppSidebarProps) {
	const router = useRouter();
	const { id } = router.query;

	const {
		displaySignOutAlert,
		setDisplaySignOutAlert,
		notebooksData,
		notebooksIsLoading,
		notebooksIsError,
		onNewNotebook,
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
					onAction={() => signOut({ callbackUrl: "/sign_in" })}
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
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel asChild>
						<div className="flex items-center gap-4 justify-between mb-2">
							<span>Notebooks</span>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button onClick={onNewNotebook} variant="ghost" size="icon">
										<DocumentPlusIcon className="min-w-5 w-5 h-5" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>New notebook</TooltipContent>
							</Tooltip>
						</div>
					</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{notebooksIsLoading &&
								skeletons.map((skeleton, index) => {
									return <Fragment key={index}>{skeleton}</Fragment>;
								})}
							{!notebooksIsLoading &&
								!notebooksIsError &&
								notebooksData &&
								notebooksData.map((notebook) => {
									return (
										<NotebookCard
											key={notebook.id}
											id={notebook.id}
											name={notebook.name}
											selectedNotebookId={id as string}
										/>
									);
								})}
							{!notebooksIsLoading &&
								!notebooksIsError &&
								notebooksData &&
								notebooksData.length === 0 && (
									<div className="p-4">
										<FeedbackMessage
											status="INFORMATION"
											message="No hay cuadernos para mostrar"
										/>
									</div>
								)}
							{!notebooksIsLoading && notebooksIsError && (
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
			<SidebarRail className="bg-mochaBase after:bg-mochaMantle" />
		</Sidebar>
	);
}
