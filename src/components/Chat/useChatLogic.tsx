import { api } from "~/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import type { Message } from "~/server/api/services/chat";
import { typeid } from "typeid-js";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";
import { useMutation } from "@tanstack/react-query";
import { DefaultChatTransport, type UIMessage, type ModelMessage } from "ai-v5";
import { useChat } from "@ai-sdk/react";
import type { AiForm } from "~/lib/schemas/aiForm";
import { DateTime } from "luxon";
import type { Session } from "next-auth";
import { now } from "next-auth/client/_utils";

export type MyUIMessage = UIMessage<{
	id: Message["id"];
	userId: Message["userId"];
	chatId: Message["chatId"];
	content: Message["content"];
	metadata: Message["metadata"];
	parts: Message["parts"];
	quote: Message["quote"];
	role: Message["role"];
	createdAt: number;
	updatedAt: number;
}>;

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

export type ChatModes =
	| "form-generation-mode"
	| "web-search-mode"
	| "reasoning-mode";

export const parseUIMessage = (message?: MyUIMessage): Message | null => {
	if (message) {
		const { metadata, parts } = message;
		const textParts = parts.filter((part) => part.type === "text");

		if (!metadata) {
			toast(
				"Metadata is missing in the assistant message, but is required for parsing.",
			);
			return null;
		}

		return {
			...metadata,
			createdAt: DateTime.fromMillis(metadata.createdAt).toJSDate(),
			updatedAt: DateTime.fromMillis(metadata.updatedAt).toJSDate(),
			content: textParts.map((part) => part.text).join(""),
			parts,
			role: message.role,
		};
	}

	return null;
};

const createAssistantMessageMetadata = (chatId: string, session: Session) => {
	return {
		id: typeid().toUUID(),
		chatId,
		userId: session.user.id,
		createdAt: Date.now(),
		updatedAt: Date.now(),
		content: "",
		role: "assistant",
		quote: null,
		parts: [],
		metadata: null,
	};
};

export const useChatLogic = ({ chatId, isNew }: UseChatLogicProps) => {
	const router = useRouter();
	const utils = api.useUtils();
	const { data: session } = useSession();
	const [messages, setMessages] = useState<Message[]>([]);
	const chatContainer = useRef<HTMLDivElement | null>(null);
	const {
		readerEvent,
		setReaderEvent,
		document,
		editor,
		setDisplayFormEditor,
		setFormData,
	} = useWorkspaceStore();
	const [quote, setQuote] = useState<string | null>(null);
	const [chatModes, setChatModes] = useState<ChatModes[]>([]);
	const [contextItems, setContextItems] = useState<ContextEntity[]>([
		{
			label: "Editor",
			type: "editor",
		},
	]);

	const {
		messages: tempMessages,
		sendMessage,
		setMessages: cleanUseChatMessages,
		status,
		stop,
	} = useChat<MyUIMessage>({
		experimental_throttle: 100,
		transport: new DefaultChatTransport({
			api: "/api/ai/chat",
		}),
		onToolCall: (data) => {
			if (data.toolCall.toolName === "generateForm") {
				setDisplayFormEditor(true);
				setFormData(data.toolCall.input as AiForm);
			}
		},
		onFinish: (data) => {
			if (!session) {
				toast("Please sign in to save your message");
				return;
			}

			const message = parseUIMessage(data.message);

			if (!message) {
				toast("Assistant message not found");
				return;
			}

			if (!isNew && router.pathname !== "/") {
				createMessage({
					chatId,
					message,
				});
			}

			if (router.pathname === "/" && isNew) {
				const firstUserMessageString = localStorage.getItem(
					"pennink-user-message",
				);

				if (firstUserMessageString) {
					const firstUserMessage = JSON.parse(
						firstUserMessageString,
					) as Message;

					localStorage.setItem(
						"buuddy.new-workspace-messages",
						JSON.stringify([firstUserMessage, message]),
					);

					createWorkspace({
						name: "...",
						messages: [
							{
								...firstUserMessage,
								createdAt: DateTime.fromMillis(
									firstUserMessage.createdAt as unknown as number,
								).toJSDate(),
								updatedAt: DateTime.fromMillis(
									firstUserMessage.updatedAt as unknown as number,
								).toJSDate(),
							},
							message,
						],
						chatId,
					});
				}
			}
		},
		onError: (error) => {
			console.error("An error occurred:", error);
		},
	});

	const stopStreaming = async () => {
		if (!isNew && router.pathname !== "/" && status === "streaming") {
			await stop();

			const message = parseUIMessage(tempMessages[0]);

			if (message) {
				createMessage({
					chatId,
					message,
				});
			}
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
		data: messagesData,
		isLoading: messagesIsLoading,
		isError: messagesIsError,
	} = api.chat.messagesByChatId.useQuery(
		{
			chatId,
		},
		{
			enabled: !isNew,
			refetchOnWindowFocus: false,
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
			if (data.role === "assistant") {
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
		const messagesContext: ModelMessage[] = []; //Array of ModelMessage context
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
			role: "user",
			quote,
			parts: [],
			metadata: null,
		};

		const currentAssistantMessage = parseUIMessage(tempMessages[0]);

		if (currentAssistantMessage) {
			setMessages((prev) => {
				return [...prev, currentAssistantMessage, message];
			});

			cleanUseChatMessages([]);
		} else {
			setMessages((prev) => {
				return [...prev, message];
			});
		}

		try {
			await triggerChatMessagesRuleMutate();
		} catch (error) {
			console.error(error);
			return;
		}

		if (isNew || router.pathname === "/") {
			localStorage.setItem(
				"pennink-user-message",
				JSON.stringify({
					...message,
					createdAt: Date.now(),
					updatedAt: Date.now(),
				}),
			);

			await sendMessage(undefined, {
				body: {
					context: {
						messages: [],
					},
					chatModes: [],
					prompt: data.prompt,
					metadata: createAssistantMessageMetadata(chatId, session),
				},
			});

			return;
		}

		createMessage({
			chatId,
			message,
		});

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
				role: message.role,
			})),
		];

		if (currentAssistantMessage) {
			fullContextMessages.push({
				content: currentAssistantMessage.content,
				role: currentAssistantMessage.role,
			});
		}

		await sendMessage(undefined, {
			body: {
				context: {
					messages: fullContextMessages,
				},
				chatModes,
				prompt: data.prompt,
				metadata: createAssistantMessageMetadata(chatId, session),
			},
		});
	};

	useEffect(() => {
		const lastMessage = messages[messages.length - 1];

		if (chatContainer.current) {
			if (lastMessage?.role === "user") {
				chatContainer.current.scrollTo({
					top: chatContainer.current.scrollHeight,
					behavior: "smooth",
				});
			}
		}
	}, [chatContainer, messages.length]);

	useEffect(() => {
		if (chatContainer.current) {
			chatContainer.current.scrollTo({
				top: chatContainer.current.scrollHeight,
				behavior: "smooth",
			});
		}
	}, [tempMessages[0]?.id, chatContainer]);

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

			const fullContextMessages = [
				...messages.map((message) => ({
					content: message.content,
					role: message.role,
				})),
			];

			const currentAssistantMessage = parseUIMessage(tempMessages[0]);

			if (currentAssistantMessage) {
				fullContextMessages.push({
					content: currentAssistantMessage.content,
					role: currentAssistantMessage.role,
				});
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
					role: "user",
					quote: null,
					parts: [],
					metadata: null,
				};

				createMessage({
					chatId,
					message,
				});

				setMessages((prev) => {
					return [...prev, message];
				});

				await sendMessage(undefined, {
					body: {
						context: {
							messages: fullContextMessages,
						},
						chatModes,
						prompt,
						metadata: createAssistantMessageMetadata(chatId, session),
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
					role: "user",
					quote: null,
					metadata: null,
					parts: [],
				};

				createMessage({
					chatId,
					message,
				});

				setMessages((prev) => {
					return [...prev, message];
				});

				await sendMessage(undefined, {
					body: {
						context: {
							messages: fullContextMessages,
						},
						chatModes,
						prompt,
						metadata: createAssistantMessageMetadata(chatId, session),
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

	useEffect(() => {
		if (document) {
			setContextItems((prv) => {
				return [
					...prv.filter((item) => item.type !== "document"),
					{
						label: document.filename,
						type: "document",
					},
				];
			});
		}
	}, [document]);

	return {
		onSentPrompt,
		useChatForm,
		tempMessages,
		messages,
		createWorkspaceIsPending,
		router,
		messagesIsLoading,
		messagesIsError,
		chatContainer,
		quote,
		onRemoveQuote,
		onToggleChatModes,
		chatModes,
		documentVectorSearchMutationIsPending,
		document,
		stopStreaming,
		handleKeyDown,
		triggerChatMessagesRuleIsPending,
		contextItems,
		setContextItems,
		status,
	};
};
