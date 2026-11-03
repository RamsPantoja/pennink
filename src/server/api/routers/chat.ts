import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import {
	createMessageInputSchema,
	getMessagesByChatIdInputSchema,
	updateMessagePartsInputSchema,
} from "../schemas/chat";

export const chatRouter = createTRPCRouter({
	messagesByChatId: protectedProcedure
		.input(getMessagesByChatIdInputSchema)
		.query(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.chatService.getMessagesByChatId(input.chatId);
		}),
	createMessage: protectedProcedure
		.input(createMessageInputSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.services({ ctx }).chatService.createMessage(input);
		}),
	updateMessageParts: protectedProcedure
		.input(updateMessagePartsInputSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.chatService.updateMessageParts(input, ctx.session.user.id);
		}),
	triggerChatMessagesRule: protectedProcedure.mutation(async ({ ctx }) => {
		return await ctx
			.services({ ctx })
			.chatService.chatMessagesRule(ctx.session.user.id);
	}),
});
