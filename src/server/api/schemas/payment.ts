import { z } from "zod";

export const createStripeAccountInputSchema = z.object({
	accountId: z.string(),
});

export const stripeItemSchema = z.object({
	unitPrice: z.number({
		required_error: "unitPrice is required",
	}),
	quantity: z.number({
		required_error: "quantity is required",
	}),
	concept: z.string({
		required_error: "concept is required",
	}),
});

export const stripePaymentProcessInput = z.object({
	metadata: z.any().nullable(),
	checkoutSessionId: z.string(),
	amount: z.number().nullable(),
	paymentIntentId: z.string().nullable(),
});

export const newStripePaymentInput = z.object({
	accountId: z.string(),
});

export const updateStripeConnectOnBoardingInput = z.object({
	accountId: z.string(),
	state: z.boolean(),
});

export const createPaymentSubscriptionInput = z.object({
	lookupKeys: z.array(z.string()).default([]),
	successUrl: z.string().url(),
	cancelUrl: z.string().url(),
});
