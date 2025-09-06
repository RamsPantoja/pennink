import { z } from "zod";

export const getNoteByShareLinkIdInputSchema = z.object({
	shareLinkId: z.string().uuid(),
});

export const createShareLinkForNoteInputSchema = z.object({
	noteId: z.string().uuid(),
	key: z.string().min(1),
});

export const getShareLinkByNoteIdInputSchema = z.object({
	noteId: z.string().uuid(),
});
