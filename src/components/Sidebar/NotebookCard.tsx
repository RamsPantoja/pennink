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

type NotebookCardProps = {
	id: string;
	selectedNotebookId: string;
	name: string;
};

export const NotebookCard = ({
	id,
	selectedNotebookId,
	name,
}: NotebookCardProps) => {
	const { data: session } = useSession();
	const [notebookTitle, setNotebookTitle] = useState<string>(name);

	const { mutate: updateNotebookName, isPending: updateNotebookNameIsPending } =
		api.notebook.updateName.useMutation({
			onSuccess: (data) => {
				localStorage.removeItem("buuddy.new-notebook-messages");
			},
			onError: (error) => {
				console.error(error.message);
			},
		});

	const router = useRouter();

	const generateNotebookTitle = async () => {
		const newNotebookMessages = localStorage.getItem(
			"buuddy.new-notebook-messages",
		);

		const messages: Message[] = [];

		try {
			if (!session) {
				throw new Error("User is not authenticated");
			}

			if (newNotebookMessages) {
				const newNotebookMessagesParsed = JSON.parse(
					newNotebookMessages,
				) as Message[];

				messages.push(...newNotebookMessagesParsed);
			}

			const res = await fetch("/api/ai/notebook-title", {
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
		data: notebookTitleData,
		isLoading: isLoadingNotebookTitle,
		isError: isErrorNotebookTitle,
	} = useQuery({
		queryKey: ["notebook-title", id],
		queryFn: generateNotebookTitle,
		enabled: notebookTitle === "..." && selectedNotebookId === id,
	});

	useEffect(() => {
		if (notebookTitleData && id === selectedNotebookId) {
			const handleStream = async () => {
				const stream = notebookTitleData.body;

				if (!stream) return;

				try {
					const reader = stream.getReader();
					const textDecoder = new TextDecoder();
					let title = "";

					while (true) {
						const { done, value } = await reader.read();

						if (value) {
							title = title.concat(textDecoder.decode(value));
							setNotebookTitle(title);
						}

						if (done) {
							reader.releaseLock();
							updateNotebookName({
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
	}, [notebookTitleData, id, selectedNotebookId]);

	return (
		<SidebarMenuItem>
			<SidebarMenuButton
				onClick={() => {
					router.push(`/notebook/${id}`);
				}}
				asChild
				isActive={id === selectedNotebookId}
				className="pr-0"
			>
				<div className="flex items-center w-full">
					<span
						title={notebookTitle}
						className={cn([
							"font-semibold cursor-pointer truncate w-full ",
							{
								"animate-pulse":
									updateNotebookNameIsPending || isLoadingNotebookTitle,
							},
						])}
					>
						{notebookTitle}
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
