import type { z } from "zod";
import type { TRPCContext } from "../../trpc";
import { messages, statics } from "~/server/db/schema";
import type {
	createMessageInputSchema,
	updateMessagePartsInputSchema,
} from "../schemas/chat";
import { TRPCError } from "@trpc/server";
import { DateTime } from "luxon";
import { and, eq } from "drizzle-orm";
import { userHasClassroom } from "./classroom";

export type Message = typeof messages.$inferSelect;

type ChatConstructor = {
	ctx: TRPCContext;
};

type CreateMessageInput = z.infer<typeof createMessageInputSchema>;
type UpdateMessagePartsInput = z.infer<typeof updateMessagePartsInputSchema>;

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
			orderBy: (messages, { asc }) => [asc(messages.id)],
		});

		return messages;
	}

	private async createMessageRule(userId: string) {
		if (!(await userHasClassroom(this.ctx.db, userId))) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Create a classroom before chatting",
			});
		}

		const limitMessages = 20;
		const limitedChatMessagesMessageFreeSub = `You have reached the maximum number of chat messages/day (${limitMessages}). Upgrade to Pennink Pro to get more!.`;
		const userStatics = await this.ctx.db.query.statics.findFirst({
			where: (statics, { eq }) => {
				return eq(statics.userId, userId);
			},
			with: {
				user: true,
			},
		});

		if (!userStatics) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "User statics not found",
			});
		}

		const ruleForFreeSub = async () => {
			const referenceDate = DateTime.fromJSDate(
				userStatics.workspacesResetedAt, //Working with workspaces resetDate
			);
			const currentDate = DateTime.now();
			const diff = currentDate.diff(referenceDate, "days");

			if (diff.days < 1 && userStatics.messages >= limitMessages) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: limitedChatMessagesMessageFreeSub,
				});
			}

			//Reset messages metric to 0 to allow user send messages again
			if (diff.days >= 1) {
				await this.ctx.db
					.update(statics)
					.set({
						messages: 0,
						workspacesResetedAt: new Date(),
					})
					.where(eq(statics.id, userStatics.id));
			}
		};

		switch (userStatics.user.subscription) {
			case "PRO":
				{
				}
				break;
			case "FREE":
				{
					await ruleForFreeSub();
				}
				break;
			default:
				{
					await ruleForFreeSub();
				}
				break;
		}

		return userStatics;
	}

	public async createMessage(input: CreateMessageInput) {
		const { message } = input;

		const ruleRes = await this.createMessageRule(input.message.userId);

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

		if (message.role === "assistant") {
			await this.ctx.db
				.update(statics)
				.set({
					messages: ruleRes.messages + 1,
				})
				.where(eq(statics.id, ruleRes.id));
		}

		return message;
	}

	// Saves the answers to an askUser card on the message that asked, so a reload shows them.
	public async updateMessageParts(
		input: UpdateMessagePartsInput,
		userId: string,
	) {
		const [updated] = await this.ctx.db
			.update(messages)
			.set({ parts: input.parts })
			.where(
				and(
					eq(messages.id, input.messageId),
					eq(messages.chatId, input.chatId),
					eq(messages.userId, userId),
				),
			)
			.returning({ id: messages.id });

		if (!updated) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Message not found",
			});
		}

		return updated;
	}

	public chatMessagesRule(userId: string) {
		return this.createMessageRule(userId);
	}
}
