import { useEffect, useState } from "react";
import { SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";
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
import CustomAlertDialog from "../common/AlertDialog";
import { Input } from "../ui/input";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isWeakMap } from "node:util/types";
import { useRouter } from "next/navigation";
import Link from "next/link";

type WorkspaceCardProps = {
	id: string;
	selectedWorkspaceId: string;
	name: string;
};

const workspaceNameSchemaValidation = z.object({
	name: z.string().min(2).max(100),
});

type WorkspaceNameForm = z.infer<typeof workspaceNameSchemaValidation>;

export const WorkspaceCard = ({
	id,
	selectedWorkspaceId,
	name,
}: WorkspaceCardProps) => {
	const router = useRouter();
	const { data: session } = useSession();
	const [workspaceName, setWorkspaceName] = useState<string>(name);
	const { setDocument } = useWorkspaceStore();
	const [displayDeleteWorkspaceAlert, setDisplayDeleteWorkspaceAlert] =
		useState<boolean>(false);
	const utils = api.useUtils();
	const [isWorkspaceNameEditable, setIsWorkspaceNameEditable] =
		useState<boolean>(false);

	const {
		register,
		handleSubmit,
		setFocus,
		formState: { errors },
		watch,
	} = useForm<WorkspaceNameForm>({
		resolver: zodResolver(workspaceNameSchemaValidation),
		defaultValues: { name: workspaceName },
	});

	const {
		mutate: updateWorkspaceName,
		isPending: updateWorkspaceNameIsPending,
	} = api.workspace.updateName.useMutation({
		onSuccess: (data) => {
			localStorage.removeItem("buuddy.new-workspace-messages");
			setWorkspaceName(data.name);
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
							role: message.role,
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
			enabled: workspaceName === "..." && selectedWorkspaceId === id,
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
							setWorkspaceName(title);
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

	useEffect(() => {
		if (isWorkspaceNameEditable) {
			setFocus("name");
		}
	}, [isWorkspaceNameEditable, setFocus]);

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
			{isWorkspaceNameEditable && (
				<Input
					{...register("name")}
					onBlur={() => {
						setIsWorkspaceNameEditable(false);
						handleSubmit((data: WorkspaceNameForm) => {
							updateWorkspaceName({
								id,
								name: data.name,
							});
						})();
					}}
				/>
			)}
			{!isWorkspaceNameEditable && (
				<SidebarMenuButton
					asChild
					isActive={id === selectedWorkspaceId}
					className={cn(["pr-0 cursor-pointer"])}
				>
					<Link
						onClick={() => {
							setDocument(null);
						}}
						prefetch={false}
						href={`/workspace/${id}`}
					>
						<div className="flex items-center w-full">
							<span
								title={workspaceName}
								className={cn([
									"text-xs truncate w-full font-semibold",
									{
										"animate-pulse":
											updateWorkspaceNameIsPending || isLoadingWorkspaceTitle,
									},
								])}
							>
								{workspaceName}
							</span>
							<DropdownMenu modal={false}>
								<DropdownMenuTrigger
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
									}}
									className="h-8 min-w-8 w-fit inline-flex gap-2 items-center justify-center whitespace-nowrap rounded-md"
								>
									<EllipsisVerticalIcon className="h-5 min-w-5" />
								</DropdownMenuTrigger>
								<DropdownMenuContent
									side="right"
									onCloseAutoFocus={(e) => {
										e.preventDefault();
										e.stopPropagation();
									}}
								>
									<DropdownMenuItem
										onClick={(e) => {
											e.preventDefault();
											e.stopPropagation();
											setIsWorkspaceNameEditable(true);
										}}
										className="flex gap-2"
									>
										<PencilSquareIcon className="min-w-5 w-5 h-5" />
										Rename
									</DropdownMenuItem>
									<DropdownMenuItem
										onClick={(e) => {
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
					</Link>
				</SidebarMenuButton>
			)}
		</SidebarMenuItem>
	);
};
