import { toast } from "sonner";
import { api } from "~/utils/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import type { Message } from "~/server/api/services/aiChat";
import { typeid } from "typeid-js";

const chatValidationSchema = z.object({
	prompt: z.string().trim().min(1),
});

export type ChatValidationSchema = z.infer<typeof chatValidationSchema>;

type UseChatLogicProps = {};

export const useChatLogic = ({}: UseChatLogicProps) => {
	const [messages, setMessages] = useState<Message[]>([]);
	const [currentAssistantMessage, setCurrentAssistantMessage] =
		useState<Message | null>(null);
	const [chatIsPending, setChatIsPending] = useState(false);

	const useChatForm = useForm<ChatValidationSchema>({
		resolver: zodResolver(chatValidationSchema),
		defaultValues: {
			prompt: "",
		},
	});

	const onSentPrompt = async (data: ChatValidationSchema) => {
		setChatIsPending(true);
		try {
			const chatResponse = await fetch("/api/ai/chat", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ prompt: data.prompt }),
			});

			setChatIsPending(false);

			const stream = chatResponse.body;

			if (stream) {
				const reader = stream.getReader();
				const textDecoder = new TextDecoder();

				while (true) {
					const { done, value } = await reader.read();

					if (value) {
						setCurrentAssistantMessage((prev) => {
							if (prev) {
								return {
									id: prev.id,
									chatId: prev.chatId,
									userId: prev.userId,
									createdAt: prev.createdAt,
									updatedAt: prev.updatedAt,
									content: prev.content.concat(textDecoder.decode(value)),
								};
							}

							return {
								id: typeid().toString(),
								chatId: typeid().toString(),
								userId: typeid().toString(),
								createdAt: new Date(),
								updatedAt: new Date(),
								content: "".concat(textDecoder.decode(value)),
							};
						});
					}

					if (done) {
						reader.releaseLock();
						break;
					}
				}
			}
		} catch (error) {
			console.error(error);
		}
	};

	return {
		onSentPrompt,
		useChatForm,
		currentAssistantMessage,
		messages,
		chatIsPending,
	};
};
