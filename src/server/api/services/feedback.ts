import type { z } from "zod";
import type { TRPCContext } from "../../trpc";
import type { Session } from "next-auth";
import { TRPCError } from "@trpc/server";
import { feedbacks } from "~/server/db/schema";
import type { createFeedbackInputSchema } from "../schemas/feedback";

type FeedbackServiceContructor = {
	ctx: TRPCContext;
};

export type FeedbackInsert = typeof feedbacks.$inferInsert;
export type CreateFeedbackInput = {
	createFeedbackInputSchema: z.infer<typeof createFeedbackInputSchema>;
	session: Session;
};

export class FeedbackService {
	ctx: TRPCContext;

	constructor({ ctx }: FeedbackServiceContructor) {
		this.ctx = ctx;
	}

	async create(input: CreateFeedbackInput) {
		const [feedback] = await this.ctx.db
			.insert(feedbacks)
			.values({
				content: input.createFeedbackInputSchema.content,
				userId: input.session.user.id,
			})
			.returning();

		if (!feedback) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "Feedback was not sent",
			});
		}

		return feedback;
	}
}
