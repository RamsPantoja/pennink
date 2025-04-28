import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const subscriptionRouter = createTRPCRouter({
	getSubscription: protectedProcedure.query(async ({ ctx }) => {
		return await ctx
			.services({ ctx })
			.subscriptionService.getUserSubscription(ctx.session.user.id);
	}),
});
