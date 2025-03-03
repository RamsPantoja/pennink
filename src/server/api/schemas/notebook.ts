import { z } from "zod";
import { messageRoleEnum } from "~/server/db/schema";

const messageSchema = z.object({
	id: z.string().uuid(),
	chatId: z.string().uuid(),
	content: z.string().min(1),
	role: z.enum(messageRoleEnum.enumValues),
	userId: z.string().uuid(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const createNotebookInputSchema = z.object({
	name: z.string().min(2).max(100),
	messages: z.array(messageSchema).min(1),
	chatId: z.string().uuid(),
});

export const notebookByIdInputSchema = z.object({
	id: z.string(),
});
