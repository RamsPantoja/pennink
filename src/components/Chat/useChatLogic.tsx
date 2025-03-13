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
	const [messages, setMessages] = useState<Message[]>([]);
	const [currentAssistantMessage, setCurrentAssistantMessage] =
		useState<Message | null>(null);
	const [chatIsPending, setChatIsPending] = useState(false);
	const chatContainer = useRef<HTMLDivElement | null>(null);

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

	const { mutate: createNotebook, isPending: createNotebookIsPending } =
		api.notebook.create.useMutation({
			onSuccess: async (data) => {
				router.push(`/notebook/${data.id}`);
			},
			onError: (error) => {
				console.error(error.message);
			},
		});

	const onSentPrompt = async (data: ChatValidationSchema) => {
		setChatIsPending(true);
		useChatForm.setValue("prompt", "");

		try {
			if (!session) {
				throw new Error("User is not authenticated");
			}

			const newUserMessage: Message = {
				id: typeid().toUUID(),
				chatId,
				userId: session.user.id,
				createdAt: new Date(),
				updatedAt: new Date(),
				content: data.prompt,
				role: "USER",
			};

			setMessages((prevMessages) => {
				return [...prevMessages, newUserMessage];
			});

			const agentResponse = await fetch("/api/ai/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					prompt: data.prompt,
					context: {
						messages: messages.map((message) => ({
							content: message.content,
							role: messageRoleVercelSDK[message.role],
						})),
					},
				}),
			});

			const stream = agentResponse.body;

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
						setMessages((prev) => {
							return [...prev, newAgentMessage];
						});

						if (router.pathname === "/") {
							localStorage.setItem(
								"buuddy.new-notebook-messages",
								JSON.stringify([newUserMessage, newAgentMessage]),
							);

							createNotebook({
								name: "...",
								messages: [newUserMessage, newAgentMessage],
								chatId,
							});
						}

						setChatIsPending(false);
						break;
					}
				}
			}
		} catch (error) {
			setChatIsPending(false);
			console.error(error);
		}
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
		createNotebookIsPending,
		router,
		messagesIsLoading,
		messagesIsError,
		chatContainer,
	};
};
