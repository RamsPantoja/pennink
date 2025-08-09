import { api } from "~/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import type { Message } from "~/server/api/services/chat";
import { typeid } from "typeid-js";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { messageRoleVercelSDK } from "~/lib/utils";
import { toast } from "sonner";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";
import { useMutation } from "@tanstack/react-query";
import type { AgentChatRequestData } from "~/app/api/ai/chat/route";
import type { CoreMessage } from "ai";
import {
	Bars3BottomLeftIcon,
	DocumentTextIcon,
} from "@heroicons/react/24/outline";
import type { JSX } from "react/jsx-runtime";

const chatValidationSchema = z.object({
	prompt: z.string().trim().min(1),
});

export type ChatValidationSchema = z.infer<typeof chatValidationSchema>;

type UseChatLogicProps = {
	chatId: string;
	isNew: boolean;
};

type ThreadContext = {
	id: string;
	label: string;
	type: "thread";
};

type DocumentContext = {
	label: string;
	type: "document";
};

type EditorContext = {
	label: string;
	type: "editor";
};

type ContextEntity = ThreadContext | DocumentContext | EditorContext;

export type ChatModes = "ask-mode" | "web-search-mode" | "reasoning-mode";

export const useChatLogic = ({ chatId, isNew }: UseChatLogicProps) => {
	const router = useRouter();
	const utils = api.useUtils();
	const { data: session } = useSession();
	const [currentAssistantMessage, setCurrentAssistantMessage] =
		useState<Message | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const chatContainer = useRef<HTMLDivElement | null>(null);
	const { readerEvent, setReaderEvent, document, editor } = useWorkspaceStore();
	const [quote, setQuote] = useState<string | null>(null);
	const [lastUserMessage, setLastUserMessage] = useState<Message | null>();
	const [chatModes, setChatModes] = useState<ChatModes[]>([]);
	const [isStreaming, setIsStreaming] = useState(false);
	const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
	const abortControllerRef = useRef<AbortController | null>(null);
	const [contextItems, setContextItems] = useState<ContextEntity[]>([
		{
			label: "Editor",
			type: "editor",
		},
	]);

	const stopStreaming = async () => {
		if (readerRef.current) {
			await readerRef.current.cancel();
			readerRef.current = null;
			setIsStreaming(false);
		}
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
			abortControllerRef.current = null;
		}
	};

	const {
		mutateAsync: documentVectorSearchMutation,
		isPending: documentVectorSearchMutationIsPending,
	} = api.workspace.documentVectorSearch.useMutation({
		onError: (error) => {
			console.error("Mutation failed:", error);
			toast.error("An error occurred while sending your message.");
		},
	});

	const {
		mutate: onSentPromptMutation,
		isPending: onSentPromptMutationIsPending,
	} = useMutation({
		mutationFn: (data: AgentChatRequestData) => {
			// Create new AbortController for this request
			abortControllerRef.current = new AbortController();

			return fetch("/api/ai/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					prompt: data.prompt,
					context: data.context,
				}),
				signal: abortControllerRef.current.signal,
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
					readerRef.current = reader;
					setIsStreaming(true);

					const textDecoder = new TextDecoder();
					const newAgentMessage: Message = {
						id: typeid().toUUID(),
						chatId,
						userId: session.user.id,
						createdAt: new Date(),
						updatedAt: new Date(),
						content: "",
						role: "AGENT",
						quote: null,
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
							readerRef.current = null;
							setIsStreaming(false);
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
				setIsStreaming(false);
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
		onSuccess: async (data) => {
			if (data.role === "AGENT") {
				await utils.user.statics.invalidate();
			}
		},
		onError: (error) => {
			console.error(error.message);
		},
	});

	const {
		mutateAsync: triggerChatMessagesRuleMutate,
		isPending: triggerChatMessagesRuleIsPending,
	} = api.chat.triggerChatMessagesRule.useMutation({
		onError: (error) => {
			toast(error.message);
		},
	});

	const onSentPrompt = async (data: ChatValidationSchema) => {
		const messagesContext: CoreMessage[] = []; //Array of CoreMessage context
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
			quote,
		};
		setLastUserMessage(message);
		setMessages((prev) => {
			return [...prev, message];
		});

		try {
			await triggerChatMessagesRuleMutate();
		} catch (error) {
			console.error(error);
			return;
		}

		if (!isNew && router.pathname !== "/") {
			createMessage({
				chatId,
				message,
			});
		}

		if (contextItems.find((item) => item.type === "document")) {
			if (!document) {
				toast("Select a document before asking");
				return;
			}

			const documentContext = await documentVectorSearchMutation({
				query: data.prompt,
				fileId: document.id,
			});

			if (documentContext.length > 0) {
				messagesContext.push({
					content: `Document context information: ${documentContext.map((context) => context.embedding_document?.content).join(", ")}`,
					role: "system",
				});
			}
		}

		if (contextItems.find((item) => item.type === "editor")) {
			if (!editor) {
				toast.error("Editor instance not found");
				return;
			}

			const markdown = await editor.blocksToMarkdownLossy(editor.document);

			messagesContext.push({
				content: `Editor context information: ${markdown}`,
				role: "system",
			});
		}

		if (quote) {
			setQuote(null);
			messagesContext.push({
				content: `Use the following context quote to enhance your response: "${quote}"`,
				role: "system",
			});

			return;
		}

		const fullContextMessages = [
			...messagesContext,
			...messages.map((message) => ({
				content: message.content,
				role: messageRoleVercelSDK[message.role],
			})),
		];

		onSentPromptMutation({
			prompt: data.prompt,
			context: {
				messages: fullContextMessages,
			},
		});
	};

	useEffect(() => {
		const lastMessage = messages[messages.length - 1];

		if (chatContainer.current) {
			if (lastMessage?.role === "USER") {
				chatContainer.current.scrollTo({
					top: chatContainer.current.scrollHeight,
					behavior: "smooth",
				});
			}

			if (lastMessage?.role === "AGENT") {
				chatContainer.current.scrollTo({
					top: chatContainer.current.scrollTop + 80,
					behavior: "smooth",
				});
			}
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

			const readerOnSummarize = () => {
				const prompt = `Summarize: ${readerEvent.data}`;

				const message: Message = {
					id: typeid().toUUID(),
					chatId,
					userId: session.user.id,
					createdAt: new Date(),
					updatedAt: new Date(),
					content: prompt,
					role: "USER",
					quote: null,
				};

				createMessage({
					chatId,
					message,
				});

				setMessages((prev) => {
					return [...prev, message];
				});

				onSentPromptMutation({
					prompt: prompt,
					context: {
						messages: [],
					},
				});
			};

			const readerOnExplain = () => {
				const prompt = `Explain: ${readerEvent.data}`;

				const message: Message = {
					id: typeid().toUUID(),
					chatId,
					userId: session.user.id,
					createdAt: new Date(),
					updatedAt: new Date(),
					content: prompt,
					role: "USER",
					quote: null,
				};

				createMessage({
					chatId,
					message,
				});

				setMessages((prev) => {
					return [...prev, message];
				});

				onSentPromptMutation({
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

	const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
		if (event.shiftKey && event.key === "Enter") {
			return;
		}

		if (event.key === "Enter") {
			event.preventDefault();
			useChatForm.handleSubmit(onSentPrompt)();
		}
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
		quote,
		onRemoveQuote,
		onToggleChatModes,
		chatModes,
		documentVectorSearchMutationIsPending,
		document,
		isStreaming,
		stopStreaming,
		handleKeyDown,
		triggerChatMessagesRuleIsPending,
		contextItems,
		setContextItems,
	};
};
