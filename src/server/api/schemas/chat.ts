import { z } from "zod";
import { messageRoleEnum } from "~/server/db/schema";

// A turn can end with only a tool call (for example askUser) and no text, so content may be
// empty when the message has a non-text part.
export const messageSchema = z
	.object({
		id: z.string().uuid(),
		chatId: z.string().uuid(),
		content: z.string(),
		role: z.enum(messageRoleEnum.enumValues),
		userId: z.string().uuid(),
		createdAt: z.date(),
		updatedAt: z.date(),
		quote: z.string().nullable(),
		metadata: z.any().nullable(),
		parts: z.array(z.any()),
	})
	.refine(
		(message) =>
			message.content.length > 0 ||
			message.parts.some((part) => part?.type !== "text"),
		{ message: "A message needs text or a tool part", path: ["content"] },
	);

export const updateMessagePartsInputSchema = z.object({
	chatId: z.string().uuid(),
	messageId: z.string().uuid(),
	parts: z.array(z.any()),
});

export const getMessagesByChatIdInputSchema = z.object({
	chatId: z.string().uuid(),
});

export const createMessageInputSchema = z.object({
	chatId: z.string().uuid(),
	message: messageSchema,
});
