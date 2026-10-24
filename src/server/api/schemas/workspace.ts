import { z } from "zod";
import { messageSchema } from "./chat";

export const createWorkspaceInputSchema = z.object({
	name: z.string().min(2).max(100),
	messages: z.array(messageSchema),
	chatId: z.string().uuid(),
	classroomId: z.string().uuid(),
});

export const workspaceByIdInputSchema = z.object({
	id: z.string(),
});

export const workspacesByClassroomInputSchema = z.object({
	classroomId: z.string().uuid(),
});

export const updateWorkspaceNameInputSchema = z.object({
	id: z.string(),
	name: z.string().min(1),
});

export const createFileInputSchema = z.object({
	filename: z.string().min(1),
	type: z.string().min(1),
	key: z.string().min(1),
	workspaceId: z.string().uuid(),
});

export const documentVectorSearchInputSchema = z.object({
	query: z.string().min(1).trim(),
	fileId: z.string().uuid(),
});

export const deleteWorkspaceInputSchema = z.object({
	id: z.string().uuid(),
});

export const getFilesByUserInputSchema = z.object({
	search: z.string().optional(),
});
