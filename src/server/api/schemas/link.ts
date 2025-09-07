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
	key: z.string().optional(),
	id: z.string().uuid(),
});
