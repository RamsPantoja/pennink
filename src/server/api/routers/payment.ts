import {
	createTRPCRouter,
	publicProcedure,
	protectedProcedure,
} from "~/server/trpc";
import type Stripe from "stripe";
import {
	createPaymentSubscriptionInput,
	stripePaymentProcessInput,
	updateStripeConnectOnBoardingInput,
} from "../schemas/payment";

export const paymentRouter = createTRPCRouter({
	getPaymentSubscriptionLink: protectedProcedure
		.input(createPaymentSubscriptionInput)
		.mutation(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.paymentService.createPaymentSubscriptionLink(
					input,
					ctx.session.user.id,
				);
		}),
	getCustomerPortalLink: protectedProcedure.mutation(async ({ ctx }) => {
		return await ctx
			.services({ ctx })
			.paymentService.generateCustomerPortalLink(ctx.session.user.id);
	}),
});
