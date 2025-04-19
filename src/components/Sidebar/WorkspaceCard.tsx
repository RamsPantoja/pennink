import { useEffect, useState } from "react";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { useRouter } from "next/router";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "~/utils/api";
import { cn, messageRoleVercelSDK } from "~/lib/utils";
import type { Message } from "~/server/api/services/chat";
import {
	EllipsisVerticalIcon,
	PencilSquareIcon,
	TrashIcon,
} from "@heroicons/react/24/outline";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Button } from "../common/Button";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";
import { toast } from "sonner";
import { AlertDialog } from "../ui/alert-dialog";
import CustomAlertDialog from "../common/AlertDialog";

type WorkspaceCardProps = {
	id: string;
	selectedWorkspaceId: string;
	name: string;
};

export const WorkspaceCard = ({
	id,
	selectedWorkspaceId,
	name,
}: WorkspaceCardProps) => {
	const { data: session } = useSession();
	const [workspaceTitle, setWorkspaceTitle] = useState<string>(name);
	const { setDocument } = useWorkspaceStore();
	const [displayDeleteWorkspaceAlert, setDisplayDeleteWorkspaceAlert] =
		useState<boolean>(false);
	const utils = api.useUtils();

	const {
		mutate: updateWorkspaceName,
		isPending: updateWorkspaceNameIsPending,
	} = api.workspace.updateName.useMutation({
		onSuccess: (data) => {
			localStorage.removeItem("buuddy.new-workspace-messages");
		},
		onError: (error) => {
			console.error(error.message);
		},
	});

	const { mutate: deleteWorkspace, isPending: deleteWorkspaceIsPending } =
		api.workspace.deleteWorkspace.useMutation({
			onSuccess: async (data) => {
				setDisplayDeleteWorkspaceAlert(false);

				if (data.id === selectedWorkspaceId) {
					setDocument(null);
					router.push("/");
				}

				await utils.workspace.workspaces.invalidate();
			},
			onError: (error) => {
				console.error(error.message);
				toast.error("Failed to delete workspace");
			},
		});

	const router = useRouter();

	const generateWorkspaceTitle = async () => {
		const newWorkspaceMessages = localStorage.getItem(
			"buuddy.new-workspace-messages",
		);

		const messages: Message[] = [];

		try {
			if (!session) {
				throw new Error("User is not authenticated");
			}

			if (newWorkspaceMessages) {
				const newWorkspaceMessagesParsed = JSON.parse(
					newWorkspaceMessages,
				) as Message[];

				messages.push(...newWorkspaceMessagesParsed);
			}

			const res = await fetch("/api/ai/workspace-title", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					context: {
						messages: messages.map((message) => ({
							content: message.content,
							role: messageRoleVercelSDK[message.role],
						})),
					},
				}),
			});

			return res;
		} catch (error) {
			console.error(error);
		}
	};

	const { data: workspaceTitleData, isLoading: isLoadingWorkspaceTitle } =
		useQuery({
			queryKey: ["workspace-title", id],
			queryFn: generateWorkspaceTitle,
			enabled: workspaceTitle === "..." && selectedWorkspaceId === id,
		});

	useEffect(() => {
		if (workspaceTitleData && id === selectedWorkspaceId) {
			const handleStream = async () => {
				const stream = workspaceTitleData.body;

				if (!stream) return;

				try {
					const reader = stream.getReader();
					const textDecoder = new TextDecoder();
					let title = "";

					while (true) {
						const { done, value } = await reader.read();

						if (value) {
							title = title.concat(textDecoder.decode(value));
							setWorkspaceTitle(title);
						}

						if (done) {
							reader.releaseLock();
							updateWorkspaceName({
								id,
								name: title,
							});
							break;
						}
					}
				} catch (error) {
					console.error(error);
				}
			};

			handleStream();
		}
	}, [workspaceTitleData, id, selectedWorkspaceId]);

	const onDeleteWorkspace = () => {
		deleteWorkspace({
			id,
		});
	};

	return (
		<SidebarMenuItem>
			<CustomAlertDialog
				cancelText="Cancel"
				actionText="Delete"
				title="Delete chat?"
				description={"Warning! Are you sure you want to delete this chat?"}
				onCancel={() => {
					setDisplayDeleteWorkspaceAlert(false);
				}}
				onAction={onDeleteWorkspace}
				isPending={deleteWorkspaceIsPending}
				open={displayDeleteWorkspaceAlert}
			/>
			<SidebarMenuButton
				onClick={async () => {
					await router.push(`/workspace/${id}`);
					setDocument(null);
				}}
				asChild
				isActive={id === selectedWorkspaceId}
				className={cn([
					"pr-0 cursor-pointer",
					{
						"border border-mochaMauve": id === selectedWorkspaceId,
					},
				])}
			>
				<div className="flex items-center w-full">
					<span
						title={workspaceTitle}
						className={cn([
							"font-normal text-xs truncate w-full",
							{
								"animate-pulse":
									updateWorkspaceNameIsPending || isLoadingWorkspaceTitle,
							},
						])}
					>
						{workspaceTitle}
					</span>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon">
								<EllipsisVerticalIcon className="h-5 min-w-5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent
							side="right"
							onCloseAutoFocus={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						>
							<DropdownMenuItem
								onSelect={async (e) => {
									e.preventDefault();
									e.stopPropagation();
									await router.push("/settings");
								}}
								className="flex gap-2"
							>
								<PencilSquareIcon className="min-w-5 w-5 h-5" />
								Rename
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={async (e) => {
									e.preventDefault();
									e.stopPropagation();
									setDisplayDeleteWorkspaceAlert(true);
								}}
								className="flex gap-2 text-red-500"
							>
								<TrashIcon className="min-w-5 w-5 h-5" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</SidebarMenuButton>
		</SidebarMenuItem>
	);
};
