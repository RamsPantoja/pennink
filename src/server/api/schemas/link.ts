import { z } from "zod";

export const getNoteByLinkIdInputSchema = z.object({
	linkId: z.string().uuid(),
});

export const createLinkForNoteInputSchema = z.object({
	noteId: z.string().uuid(),
});

export const getLinkByNoteIdInputSchema = z.object({
	noteId: z.string().uuid(),
});

export const getLinksForFormsInputSchema = z.object({
	type: z.enum(["BASIC", "EXAM"]),
	classroomId: z.string().uuid(),
	id: z.string().uuid(),
});

export const createLinkFormInputSchema = z.object({
	type: z.enum(["BASIC", "EXAM"]),
	classroomId: z.string().uuid(),
	id: z.string().uuid(),
});

export const getFormByLinkIdInputSchema = z.object({
	linkId: z.string().uuid(),
});

export const getExamByLinkIdInputSchema = z.object({
	linkId: z.string().uuid(),
});
