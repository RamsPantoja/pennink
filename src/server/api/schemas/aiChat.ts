import { z } from "zod";

export const chatInputSchema = z.object({
	userPrompt: z.string().min(1),
});
