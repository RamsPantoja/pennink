import { z } from "zod";
import { messageSchema } from "./chat";

export const createWorkspaceInputSchema = z.object({
	name: z.string().min(2).max(100),
	messages: z.array(messageSchema).min(1),
	chatId: z.string().uuid(),
});

export const workspaceByIdInputSchema = z.object({
	id: z.string(),
});

export const updateWorkspaceNameInputSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
});
