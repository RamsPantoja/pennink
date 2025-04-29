import type { TRPCContext } from "../trpc";
import { TRPCError } from "@trpc/server";

type SubscriptionConfig = {
	ctx: TRPCContext;
};

export class Subscription {
	ctx: TRPCContext;

	constructor({ ctx }: SubscriptionConfig) {
		this.ctx = ctx;
	}

	public async getUserSubscription(userId: string) {
		const subscription = await this.ctx.db.query.subscriptions.findFirst({
			where: (subscriptions, { eq, and }) => {
				return and(
					eq(subscriptions.userId, userId),
					eq(subscriptions.status, "active"),
				);
			},
		});

		if (!subscription) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Subscription not found",
			});
		}

		return subscription;
	}
}
