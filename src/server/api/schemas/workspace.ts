import { z } from "zod";
import { messageSchema } from "./chat";
import { isSourceDocumentType } from "~/lib/documentTypes";

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
	type: z.string().min(1).refine(isSourceDocumentType, "Unsupported file type"),
	key: z.string().min(1),
	workspaceId: z.string().uuid(),
});

export const documentVectorSearchInputSchema = z.object({
	query: z.string().min(1).trim(),
	fileIds: z.array(z.string().uuid()).min(1),
});

export const workspaceSourcesInputSchema = z.object({
	workspaceId: z.string().uuid(),
});

export const workspaceSourceInputSchema = z.object({
	workspaceId: z.string().uuid(),
	fileId: z.string().uuid(),
});

export const deleteWorkspaceInputSchema = z.object({
	id: z.string().uuid(),
});

export const getFilesByUserInputSchema = z.object({
	search: z.string().optional(),
});
