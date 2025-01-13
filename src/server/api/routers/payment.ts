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
	createStripeAccount: protectedProcedure
		.input(createStripeAccountInputSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.paymentService.createStripeAccount(input.accountId, ctx.session);
		}),
	stripeAccountByUserId: protectedProcedure.query(async ({ ctx }) => {
		return await ctx
			.services({ ctx })
			.paymentService.stripeAccountByUserId(ctx.session);
	}),
	connectStripe: protectedProcedure.mutation(async ({ ctx }) => {
		return await ctx
			.services({ ctx })
			.paymentService.connectStripeConnect(ctx.session);
	}),
	newAccountLink: protectedProcedure
		.input(newStripePaymentInput)
		.mutation(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.paymentService.newAccountLink(input.accountId);
		}),
	updateOnboarding: publicProcedure
		.input(updateStripeConnectOnBoardingInput)
		.mutation(async ({ ctx, input }) => {
			return await ctx.services({ ctx }).paymentService.updateOnboarding(input);
		}),
	createStripeDashboardLink: protectedProcedure.mutation(async ({ ctx }) => {
		return await ctx
			.services({ ctx })
			.paymentService.createStripeDshboardLink(ctx.session);
	}),
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
