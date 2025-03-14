import type { z } from "zod";
import type { TRPCContext } from "../trpc";
import { messages } from "~/server/db/schema";
import type { createMessageInputSchema } from "../schemas/chat";
import { TRPCError } from "@trpc/server";

export type Message = typeof messages.$inferSelect;

type ChatConstructor = {
	ctx: TRPCContext;
};

type CreateMessageInput = z.infer<typeof createMessageInputSchema>;

export class Chat {
	ctx: TRPCContext;

	constructor({ ctx }: ChatConstructor) {
		this.ctx = ctx;
	}

	public async getMessagesByChatId(id: string) {
		const messages = await this.ctx.db.query.messages.findMany({
			where: (messages, { eq }) => {
				return eq(messages.chatId, id);
			},
		});

		return messages;
	}

	public async createMessage(input: CreateMessageInput) {
		const { message } = input;

		const [newMessage] = await this.ctx.db
			.insert(messages)
			.values(message)
			.returning();

		if (!newMessage) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Failed to create message",
			});
		}

		return message;
	}
}
