import { z } from "zod";

export const updateNoteInputSchema = z.object({
	noteId: z.string().uuid(),
	content: z.object({
		time: z.number().optional(),
		blocks: z.array(
			z.object({
				id: z.string().optional(),
				type: z.string().min(1),
				data: z.any(),
			}),
		),
		version: z.string().optional(),
	}),
});

export const noteByIdInputSchema = z.object({
	id: z.string().uuid(),
});
