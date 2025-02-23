import { z } from "zod";

export const createNotebookInputSchema = z.object({
	name: z.string().min(2).max(100),
});
