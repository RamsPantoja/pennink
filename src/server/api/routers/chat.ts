import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getMessagesByChatIdInputSchema } from "../schemas/chat";

export const chatRouter = createTRPCRouter({
	messagesByChatId: protectedProcedure
		.input(getMessagesByChatIdInputSchema)
		.query(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.chatService.getMessagesByChatId(input.chatId);
		}),
});
