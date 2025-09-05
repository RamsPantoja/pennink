import { z } from "zod";

export const getSharedNoteInputSchema = z.object({
	shareLinkId: z.string().uuid(),
});
