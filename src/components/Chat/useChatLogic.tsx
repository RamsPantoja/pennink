import { api } from "~/trpc/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import type { Message } from "~/server/api/services/chat";
import { typeid } from "typeid-js";
import { useSession } from "next-auth/react";
import { sileo } from "sileo";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";
import {
	DefaultChatTransport,
	type UIMessage,
	type ModelMessage,
	convertToModelMessages,
} from "ai";
import { useChat } from "@ai-sdk/react";
import type { AiForm } from "~/app/agents/chat/schema";
import type { MindMap } from "~/app/agents/chat/mind-map";
import { DateTime } from "luxon";
import type { Session } from "next-auth";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { playAgentSpeech, stopAgentSpeech } from "~/lib/agentAudio";
import { extractSpeechText } from "~/lib/speechText";
import { getConversationTokens } from "~/lib/contextWindow";
import { useActiveClassroom } from "../Classroom/useActiveClassroom";
import useUploadObjectToStorage from "~/hooks/useUploadObjectToStorage";
import {
	CHAT_ATTACHMENT_MAX_FILES,
	CHAT_ATTACHMENT_MAX_SIZE,
	CHAT_ATTACHMENT_PREFIX,
	type ChatAttachment,
	isAllowedChatAttachmentType,
} from "~/lib/chatAttachments";

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
	prompt: z.string().trim(),
});

export type ChatValidationSchema = z.infer<typeof chatValidationSchema>;

type UseChatLogicProps = {
	chatId: string;
	isNew: boolean;
};

export const parseUIMessage = (message?: MyUIMessage): Message | null => {
	if (message) {
		const { metadata, parts } = message;
		const textParts = parts.filter((part) => part.type === "text");

		if (!metadata) {
			sileo.show({
				title:
					"Metadata is missing in the assistant message, but is required for parsing.",
			});
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
	const t = useTranslations("Chat");
	const router = useRouter();
	const pathname = usePathname();
	const utils = api.useUtils();
	const { data: session } = useSession();
	const [messages, setMessages] = useState<Message[]>([]);
	const chatContainer = useRef<HTMLDivElement | null>(null);
	const {
		setDisplayFormEditor,
		setAiFormData,
		setDisplayMindMap,
		setMindMapData,
		currentForm,
		queryFormData,
	} = useWorkspaceStore();
	const [quote, setQuote] = useState<string | null>(null);
	const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
	const {
		onUploadFile,
		loading: isUploadingAttachments,
	} = useUploadObjectToStorage();
	const newWorkspaceId = useRef<string | null>(null);
	const newWorkspaceUserMessage = useRef<Message | null>(null);
	const params = useParams();
	const workspaceId =
		typeof params?.workspaceId === "string" ? params.workspaceId : undefined;
	const { data: sources = [] } = api.workspace.sourcesByWorkspace.useQuery(
		{ workspaceId: workspaceId ?? "" },
		{ enabled: !!workspaceId },
	);

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
			if (data.toolCall.toolName === "generateAndEditForm") {
				setDisplayFormEditor(true);
				setDisplayMindMap(false);
				setAiFormData(data.toolCall.input as AiForm);
			}
			if (data.toolCall.toolName === "createMindMap") {
				setDisplayFormEditor(false);
				setMindMapData(data.toolCall.input as MindMap);
				setDisplayMindMap(true);
			}
		},
		onFinish: (data) => {
			const message = parseUIMessage(data.message);
			const speechText = extractSpeechText(data.message.parts);

			if (speechText) void playAgentSpeech(speechText);

			if (data.message.parts.some((part) => part.type === "tool-manageStudyPlan")) {
				void utils.studyPlan.listForClassroom.invalidate();
			}

			if (!session) {
				sileo.show({ title: t("toast.signInToSave") });
				return;
			}

			if (!message) {
				sileo.show({ title: t("toast.assistantMessageNotFound") });
				return;
			}

			if (pathname === "/" && isNew) {
				const workspaceId = newWorkspaceId.current;
				const firstUserMessage = newWorkspaceUserMessage.current;

				if (!workspaceId || !firstUserMessage) return;

				localStorage.setItem(
					"buuddy.new-workspace-messages",
					JSON.stringify([firstUserMessage, message]),
				);

				void createMessageAsync({
					chatId,
					message,
				}).then(() => router.push(`/workspace/${workspaceId}`));

				return;
			}

			if (!isNew && pathname !== "/") {
				createMessage({
					chatId,
					message,
				});
			}
		},
		onError: (error) => {
			console.error("An error occurred:", error);
		},
	});

	const setAgentActivity = useWorkspaceStore((state) => state.setAgentActivity);
	const audioState = useWorkspaceStore((state) => state.audioState);
	const setContextTokens = useWorkspaceStore(
		(state) => state.setContextTokens,
	);

	useEffect(() => {
		setContextTokens(getConversationTokens(messages));
	}, [messages, setContextTokens]);
	const speechMessageId = useRef<string | null>(null);
	const streamingAssistantMessage = parseUIMessage(tempMessages[0]);
	useEffect(() => {
		if (streamingAssistantMessage?.role !== "assistant") return;

		if (speechMessageId.current !== streamingAssistantMessage.id) {
			stopAgentSpeech();
			speechMessageId.current = streamingAssistantMessage.id;
		}
	}, [streamingAssistantMessage?.id]);

	useEffect(() => {
		if (status === "submitted" || status === "streaming") {
			setAgentActivity("thinking");
		} else if (status === "ready" && audioState === "idle") {
			setAgentActivity("idle");
		}
	}, [audioState, setAgentActivity, status]);

	const stopStreaming = async () => {
		if (!isNew && pathname !== "/" && status === "streaming") {
			await stop();
			stopAgentSpeech();

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
			sileo.error({ title: t("toast.sendError") });
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

	const getActiveForm = () => {
		if (!currentForm || !queryFormData) {
			return null;
		}

		return { id: currentForm.id, type: currentForm.type };
	};

	const useChatForm = useForm<ChatValidationSchema>({
		resolver: zodResolver(chatValidationSchema),
		defaultValues: {
			prompt: "",
		},
	});

	const { data: classrooms } = api.classroom.classrooms.useQuery(undefined, {
		enabled: !!session,
	});
	const { activeId: activeClassroomId } = useActiveClassroom(classrooms);
	const hasClassroom = !classrooms || classrooms.length > 0;

	const {
		mutateAsync: createWorkspaceAsync,
		isPending: createWorkspaceIsPending,
	} = api.workspace.create.useMutation({
		onSuccess: async () => {
			await utils.workspace.workspaces.invalidate();
		},
		onError: (error) => {
			console.error(error.message);
		},
	});

	const { mutate: createMessage, mutateAsync: createMessageAsync } =
		api.chat.createMessage.useMutation({
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
			sileo.show({ title: error.message });
		},
	});

	const onAddFiles = async (files: File[]) => {
		if (!session) {
			sileo.show({ title: t("toast.notAuthenticated") });
			return;
		}

		const availableSlots = Math.max(
			CHAT_ATTACHMENT_MAX_FILES - attachments.length,
			0,
		);

		if (files.length > availableSlots) {
			sileo.show({
				title: t("attachments.tooMany", {
					max: CHAT_ATTACHMENT_MAX_FILES,
				}),
			});
		}

		for (const file of files.slice(0, availableSlots)) {
			if (!isAllowedChatAttachmentType(file.type)) {
				sileo.show({
					title: t("attachments.unsupportedType", { name: file.name }),
				});
				continue;
			}

			if (file.size > CHAT_ATTACHMENT_MAX_SIZE) {
				sileo.show({
					title: t("attachments.tooLarge", { name: file.name }),
				});
				continue;
			}

			const uploaded = await onUploadFile({
				path: `${CHAT_ATTACHMENT_PREFIX}/${session.user.id}/${typeid().toUUID()}`,
				file,
			});

			if (!uploaded) continue;

			setAttachments((prev) => [
				...prev,
				{
					key: uploaded.key,
					filename: file.name,
					mediaType: file.type,
					size: file.size,
				},
			]);
		}
	};

	const onRemoveAttachment = (key: string) => {
		setAttachments((prev) => prev.filter((item) => item.key !== key));
	};

	const onSentPrompt = async (data: ChatValidationSchema) => {
		if (!hasClassroom) {
			sileo.show({ title: t("toast.createClassroomFirst") });
			return;
		}

		const sentAttachments = attachments;

		if (!data.prompt && sentAttachments.length === 0) return;

		const userMessage: ModelMessage = {
			role: "user",
			content: data.prompt ? [{ type: "text", text: data.prompt }] : [],
		}; //Array of ModelMessage context
		useChatForm.setValue("prompt", "");
		setAttachments([]);

		if (!session) {
			sileo.show({ title: t("toast.notAuthenticated") });
			return;
		}

		const message: Message = {
			id: typeid().toUUID(),
			chatId,
			userId: session.user.id,
			createdAt: new Date(),
			updatedAt: new Date(),
			content:
				data.prompt ||
				t("attachments.sentLabel", { count: sentAttachments.length }),
			role: "user",
			quote,
			parts: [],
			metadata:
				sentAttachments.length > 0 ? { attachments: sentAttachments } : null,
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

		if (isNew || pathname === "/") {
			try {
				const workspace = await createWorkspaceAsync({
					name: "...",
					messages: [message],
					chatId,
					classroomId: activeClassroomId ?? "",
				});

				newWorkspaceId.current = workspace.id;
				newWorkspaceUserMessage.current = message;
			} catch (error) {
				console.error(error);
				sileo.show({ title: t("toast.sendError") });
				return;
			}

			await sendMessage(undefined, {
				body: {
					context: {
						messages: [],
					},
					prompt: data.prompt,
					attachments: sentAttachments,
					metadata: createAssistantMessageMetadata(chatId, session),
					activeForm: getActiveForm(),
					activeClassroomId: activeClassroomId ?? null,
				},
			});

			return;
		}

		createMessage({
			chatId,
			message,
		});

		if (sources.length > 0) {
			const documentContext = await documentVectorSearchMutation({
				query: data.prompt,
				fileIds: sources.map((source) => source.id),
			});

			if (documentContext.length > 0) {
				if (Array.isArray(userMessage.content)) {
					userMessage.content.push({
						type: "text",
						text: `Document context information: ${documentContext.map((context) => context.content).join(", ")}`,
					});
				}
			}
		}

		if (queryFormData) {
			let data = "";

			if (queryFormData.type === "BASIC") {
				data = JSON.stringify({
					title: queryFormData.data.form.title,
					description: queryFormData.data.form.description,
					type: queryFormData.type,
					questions: queryFormData.data.questionsToFormVersions.map(
						(item) => {
							return {
								key: item.question.key,
								type: item.question.type,
								description: item.question.description,
								label: item.question.label,
								placeholder: item.question.placeholder,
								required: item.question.required,
								min: item.question.min,
								max: item.question.max,
								step: item.question.step,
								answer: item.question.answer,
								options: item.question.questionOptions.map((option) => {
									return {
										value: option.value,
										label: option.label,
									};
								}),
							};
						},
					),
				});
			}

			if (queryFormData.type === "EXAM") {
				data = JSON.stringify({
					title: queryFormData.data.exam.title,
					description: queryFormData.data.exam.instructions,
					type: queryFormData.type,
					questions: queryFormData.data.questionsToExamVersions.map(
						(item) => {
							return {
								key: item.question.key,
								type: item.question.type,
								description: item.question.description,
								label: item.question.label,
								placeholder: item.question.placeholder,
								required: item.question.required,
								min: item.question.min,
								max: item.question.max,
								step: item.question.step,
								answer: item.question.answer,
								options: item.question.questionOptions.map((option) => {
									return {
										value: option.value,
										label: option.label,
									};
								}),
							};
						},
					),
				});
			}

			if (Array.isArray(userMessage.content)) {
				userMessage.content.push({
					type: "text",
					text: `Current form to work with: ${data}`,
				});
			}
		}

		if (quote) {
			setQuote(null);

			if (Array.isArray(userMessage.content)) {
				userMessage.content.push({
					type: "text",
					text: `Use the following context quote to enhance your response: "${quote}"`,
				});
			}
		}

		const allMessages = messages.map((item) => {
			if (item.parts.length > 0) {
				return item;
			}

			return {
				...item,
				parts: [{ type: "text", text: item.content }] as Message["parts"],
			};
		});

		if (currentAssistantMessage) {
			allMessages.push(currentAssistantMessage);
		}

		const convertedToModelMessages = await convertToModelMessages(allMessages);

		await sendMessage(undefined, {
			body: {
				context: {
					messages: [
						...convertedToModelMessages,
						...(userMessage.content.length > 0 ? [userMessage] : []),
					],
				},
				prompt: data.prompt,
				attachments: sentAttachments,
				metadata: createAssistantMessageMetadata(chatId, session),
				activeForm: getActiveForm(),
				activeClassroomId: activeClassroomId ?? null,
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
		if (chatContainer.current && !messagesIsLoading && messages) {
			if (chatContainer.current.childElementCount === messages.length)
				chatContainer.current.scrollTo({
					top: chatContainer.current.scrollHeight,
				});
		}
	}, [messagesIsLoading, messages]);

	const onRemoveQuote = () => {
		setQuote(null);
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
		hasClassroom,
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
		attachments,
		onAddFiles,
		onRemoveAttachment,
		isUploadingAttachments,
		documentVectorSearchMutationIsPending,
		stopStreaming,
		handleKeyDown,
		triggerChatMessagesRuleIsPending,
		status,
	};
};
