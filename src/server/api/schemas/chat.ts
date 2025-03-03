import { z } from "zod";

export const getMessagesByChatIdInputSchema = z.object({
	chatId: z.string().uuid(),
});
