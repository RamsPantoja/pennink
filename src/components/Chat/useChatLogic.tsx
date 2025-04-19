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
import { CoreMessage } from "ai";

const chatValidationSchema = z.object({
	prompt: z.string().trim().min(1),
});

export type ChatValidationSchema = z.infer<typeof chatValidationSchema>;

type UseChatLogicProps = {
	chatId: string;
	isNew: boolean;
};

export type ChatModes = "ask-mode" | "web-search-mode" | "reasoning-mode";

export const useChatLogic = ({ chatId, isNew }: UseChatLogicProps) => {
	const router = useRouter();
	const { data: session } = useSession();
	const [currentAssistantMessage, setCurrentAssistantMessage] =
		useState<Message | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const chatContainer = useRef<HTMLDivElement | null>(null);
	const { readerEvent, setReaderEvent, document } = useWorkspaceStore();
	const [isStreamingLLMResponse, setIsStreamingLLMResponse] =
		useState<boolean>(false);
	const [quote, setQuote] = useState<string | null>(null);
	const [lastUserMessage, setLastUserMessage] = useState<Message | null>();
	const [chatModes, setChatModes] = useState<ChatModes[]>([]);

	console.log(chatModes);

	const {
		mutateAsync: documentVectorSearchMutation,
		isPending: documentVectorSearchMutationIsPending,
	} = api.workspace.documentVectorSearch.useMutation({
		onSuccess: (data) => {
			console.log(data);
		},
		onError: (error) => {
			console.error("Mutation failed:", error);
			toast.error("An error occurred while sending your message.");
		},
	});

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
							setMessages((prev) => {
								return [...prev, newAgentMessage];
							});

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

	const { mutate: createMessage } = api.chat.createMessage.useMutation({
		onError: (error) => {
			console.error(error.message);
		},
	});

	const onSentPrompt = async (data: ChatValidationSchema) => {
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
		setMessages((prev) => {
			return [...prev, message];
		});

		if (chatModes.includes("ask-mode")) {
			const messages: CoreMessage[] = [];

			if (quote) {
				setQuote(null);
				messages.push({
					content: `Quote context information: "${quote}"`,
					role: "system",
				});
			}

			if (!document) {
				toast("Select a document before asking");
				return;
			}

			const documentContext = await documentVectorSearchMutation({
				query: data.prompt,
				fileId: document.id,
			});

			if (documentContext.length > 0) {
				messages.push({
					content: `Context information: ${documentContext.map((context) => context.embedding_document?.content).join(", ")}`,
					role: "system",
				});
			}

			await onSentPromptMutation({
				prompt: data.prompt,
				context: {
					messages: [
						...messages,
						{
							content:
								"Only use the Quote context information and the Context information to enhance your response. Do not use any other information.",
							role: "system",
						},
					],
				},
			});

			return;
		}

		if (quote) {
			setQuote(null);
			await onSentPromptMutation({
				prompt: data.prompt,
				context: {
					messages: [
						{
							content: `Use the following context quote to enhance your response: "${quote}"`,
							role: "system",
						},
					],
				},
			});

			return;
		}

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

	//ReaderEvent listener
	useEffect(() => {
		if (readerEvent) {
			//Warning! It's very important set to null the event before executing any process or method.
			//This is for avoid unnecesary rerenders or duplicated executions
			setReaderEvent(null);

			if (!session) {
				toast("User is not authenticated");
				return;
			}

			const readerOnSummarize = async () => {
				const prompt = `Summarize: ${readerEvent.data}`;

				const message: Message = {
					id: typeid().toUUID(),
					chatId,
					userId: session.user.id,
					createdAt: new Date(),
					updatedAt: new Date(),
					content: prompt,
					role: "USER",
				};

				createMessage({
					chatId,
					message,
				});

				setMessages((prev) => {
					return [...prev, message];
				});

				await onSentPromptMutation({
					prompt: prompt,
					context: {
						messages: [],
					},
				});
			};

			const readerOnExplain = async () => {
				const prompt = `Explain: ${readerEvent.data}`;

				const message: Message = {
					id: typeid().toUUID(),
					chatId,
					userId: session.user.id,
					createdAt: new Date(),
					updatedAt: new Date(),
					content: prompt,
					role: "USER",
				};

				createMessage({
					chatId,
					message,
				});

				setMessages((prev) => {
					return [...prev, message];
				});

				await onSentPromptMutation({
					prompt: prompt,
					context: {
						messages: [],
					},
				});
			};

			if (readerEvent.type === "reader-on-summarize") {
				readerOnSummarize();
			}

			if (readerEvent.type === "reader-on-explain") {
				readerOnExplain();
			}

			if (readerEvent.type === "reader-on-chat") {
				setQuote(readerEvent.data);
			}
		}
	}, [readerEvent, session, chatId]);

	const onRemoveQuote = () => {
		setQuote(null);
	};

	const onToggleChatModes = (modes: ChatModes[]) => {
		setChatModes(modes);
	};

	return {
		onSentPrompt,
		useChatForm,
		currentAssistantMessage,
		messages,
		createWorkspaceIsPending,
		router,
		messagesIsLoading,
		messagesIsError,
		chatContainer,
		onSentPromptMutationIsPending,
		isStreamingLLMResponse,
		quote,
		onRemoveQuote,
		onToggleChatModes,
		chatModes,
		documentVectorSearchMutationIsPending,
		document,
	};
};
