import { z } from "zod";
import { messageRoleEnum } from "~/server/db/schema";

export const messageSchema = z.object({
	id: z.string().uuid(),
	chatId: z.string().uuid(),
	content: z.string().min(1),
	role: z.enum(messageRoleEnum.enumValues),
	userId: z.string().uuid(),
	createdAt: z.date(),
	updatedAt: z.date(),
	quote: z.string().nullable(),
});

export const getMessagesByChatIdInputSchema = z.object({
	chatId: z.string().uuid(),
});

export const createMessageInputSchema = z.object({
	chatId: z.string().uuid(),
	message: messageSchema,
});
