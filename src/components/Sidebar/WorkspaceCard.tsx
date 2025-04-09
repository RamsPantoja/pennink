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

	const {
		data: workspaceTitleData,
		isLoading: isLoadingWorkspaceTitle,
		isError: isErrorWorkspaceTitle,
	} = useQuery({
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

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				onClick={() => {
					router.push(`/workspace/${id}`);
				}}
				asChild
				isActive={id === selectedWorkspaceId}
				className="pr-0"
			>
				<div className="flex items-center w-full">
					<span
						title={workspaceTitle}
						className={cn([
							"font-semibold text-xs cursor-pointer truncate w-full ",
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
								onSelect={async () => {
									await router.push("/settings");
								}}
								className="flex gap-2"
							>
								<PencilSquareIcon className="min-w-5 w-5 h-5" />
								Rename
							</DropdownMenuItem>
							<DropdownMenuItem className="flex gap-2 text-red-500">
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
