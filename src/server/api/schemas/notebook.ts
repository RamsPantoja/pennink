import { z } from "zod";
import { messageRoleEnum } from "~/server/db/schema";
import { messageSchema } from "./chat";

export const createNotebookInputSchema = z.object({
	name: z.string().min(2).max(100),
	messages: z.array(messageSchema).min(1),
	chatId: z.string().uuid(),
});

export const notebookByIdInputSchema = z.object({
	id: z.string(),
});

export const updateNotebookNameInputSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
});
