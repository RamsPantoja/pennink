import {
	createTRPCRouter,
	publicProcedure,
	protectedProcedure,
} from "~/server/api/trpc";
import type Stripe from "stripe";
import {
	createPaymentSubscriptionInput,
	stripePaymentProcessInput,
	updateStripeConnectOnBoardingInput,
} from "../schemas/payment";

export const paymentRouter = createTRPCRouter({
	processPayment: publicProcedure
		.input(stripePaymentProcessInput)
		.mutation(async ({ ctx, input }) => {
			return await ctx.services({ ctx }).paymentService.processPayment({
				data: {
					metadata: input.metadata as Stripe.Metadata,
					id: input.id,
					amount: input.amount,
				},
			});
		}),
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
});
