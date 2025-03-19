import {
	createTRPCRouter,
	publicProcedure,
	protectedProcedure,
} from "~/server/api/trpc";
import type Stripe from "stripe";
import {
	createStripeAccountInputSchema,
	newStripePaymentInput,
	stripePaymentProcessInput,
	updateStripeConnectOnBoardingInput,
} from "../schemas/payment";

export const paymentRouter = createTRPCRouter({
	paymentProcess: publicProcedure
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
});
