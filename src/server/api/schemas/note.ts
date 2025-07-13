import { z } from "zod";

export const updateNoteInputSchema = z.object({
	noteId: z.string().uuid(),
	content: z.any(),
});

export const noteByIdInputSchema = z.object({
	id: z.string().uuid(),
});
