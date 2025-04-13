import { api } from "~/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useRef, useState } from "react";
import type { Message } from "~/server/api/services/chat";
import { typeid } from "typeid-js";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { messageRoleVercelSDK } from "~/lib/utils";
import { toast } from "sonner";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";
import { useMutation } from "@tanstack/react-query";
import type { AgentChatRequestData } from "~/app/api/ai/chat/route";

const chatValidationSchema = z.object({
	prompt: z.string().trim().min(1),
});

export type ChatValidationSchema = z.infer<typeof chatValidationSchema>;

type UseChatLogicProps = {
	chatId: string;
	isNew: boolean;
};

export const useChatLogic = ({ chatId, isNew }: UseChatLogicProps) => {
	const router = useRouter();
	const { data: session } = useSession();
	const [currentAssistantMessage, setCurrentAssistantMessage] =
		useState<Message | null>(null);
	const chatContainer = useRef<HTMLDivElement | null>(null);
	const { setMessages, setChatIsPending, chatIsPending, messages } =
		useWorkspaceStore();

	const [lastUserMessage, setLastUserMessage] = useState<Message | null>();

	const {
		mutateAsync: onSentPromptMutation,
		isPending: onSentPromptMutationIsPending,
	} = useMutation({
		mutationFn: (data: AgentChatRequestData) => {
			return fetch("/api/ai/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					prompt: data.prompt,
					context: data.context,
				}),
			});
		},
		onSuccess: async (data) => {
			try {
				const stream = data.body;

				if (!session) {
					throw new Error("User is not authenticated");
				}

				if (stream) {
					const reader = stream.getReader();
					const textDecoder = new TextDecoder();
					const newAgentMessage: Message = {
						id: typeid().toUUID(),
						chatId,
						userId: session.user.id,
						createdAt: new Date(),
						updatedAt: new Date(),
						content: "",
						role: "AGENT",
					};

					while (true) {
						const { done, value } = await reader.read();

						if (value) {
							newAgentMessage.content = newAgentMessage.content.concat(
								textDecoder.decode(value),
							);

							setCurrentAssistantMessage({ ...newAgentMessage });
						}

						if (done) {
							reader.releaseLock();
							setCurrentAssistantMessage(null);
							setMessages([...messages, newAgentMessage]);

							if (!isNew && router.pathname !== "/") {
								createMessage({
									chatId,
									message: newAgentMessage,
								});
							}

							if (router.pathname === "/" && isNew && lastUserMessage) {
								localStorage.setItem(
									"buuddy.new-workspace-messages",
									JSON.stringify([lastUserMessage, newAgentMessage]),
								);

								createWorkspace({
									name: "...",
									messages: [lastUserMessage, newAgentMessage],
									chatId,
								});
							}

							setChatIsPending(false);
							break;
						}
					}
				}
			} catch (error) {
				console.error("Mutation failed:", error);
				toast.error("An error occurred while sending your message.");
			}
		},
		onError: (error) => {
			// Handle error
			console.error("Mutation failed:", error);
			toast.error("An error occurred while sending your message.");
		},
	});

	const {
		data: messagesData,
		isLoading: messagesIsLoading,
		isError: messagesIsError,
	} = api.chat.messagesByChatId.useQuery(
		{
			chatId,
		},
		{
			enabled: !isNew,
		},
	);

	useEffect(() => {
		if (messagesData) {
			setMessages(messagesData);
		}
	}, [messagesData]);

	const useChatForm = useForm<ChatValidationSchema>({
		resolver: zodResolver(chatValidationSchema),
		defaultValues: {
			prompt: "",
		},
	});

	const { mutate: createWorkspace, isPending: createWorkspaceIsPending } =
		api.workspace.create.useMutation({
			onSuccess: async (data) => {
				router.push(`/workspace/${data.id}`);
			},
			onError: (error) => {
				console.error(error.message);
			},
		});

	const { mutate: createMessage, isPending: createMessageIsPending } =
		api.chat.createMessage.useMutation({
			onError: (error) => {
				console.error(error.message);
			},
		});

	const onSentPrompt = async (data: ChatValidationSchema) => {
		setChatIsPending(true);
		useChatForm.setValue("prompt", "");

		if (!session) {
			toast("User is not authenticated");
			return;
		}

		const message: Message = {
			id: typeid().toUUID(),
			chatId,
			userId: session.user.id,
			createdAt: new Date(),
			updatedAt: new Date(),
			content: data.prompt,
			role: "USER",
		};

		if (!isNew && router.pathname !== "/") {
			createMessage({
				chatId,
				message,
			});
		}

		setLastUserMessage(message);
		setMessages([...messages, message]);

		await onSentPromptMutation({
			prompt: data.prompt,
			context: {
				messages: messages.map((message) => ({
					content: message.content,
					role: messageRoleVercelSDK[message.role],
				})),
			},
		});
	};

	useEffect(() => {
		const lastMessage = messages[messages.length - 1];

		if (chatContainer.current && lastMessage?.role === "USER") {
			chatContainer.current.scrollTo({
				top: chatContainer.current.scrollHeight,
			});
		}
	}, [chatContainer, messages.length]);

	useEffect(() => {
		if (chatContainer.current) {
			chatContainer.current.scrollTo({
				top: chatContainer.current.scrollHeight,
			});
		}
	}, [chatContainer.current]);

	return {
		onSentPrompt,
		useChatForm,
		currentAssistantMessage,
		messages,
		chatIsPending,
		createWorkspaceIsPending,
		router,
		messagesIsLoading,
		messagesIsError,
		chatContainer,
		onSentPromptMutationIsPending,
	};
};
