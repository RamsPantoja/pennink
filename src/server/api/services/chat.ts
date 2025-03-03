import type { TRPCContext } from "../trpc";
import type { messages } from "~/server/db/schema";

export type Message = typeof messages.$inferSelect;

type ChatConstructor = {
	ctx: TRPCContext;
};

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
}
