import type { z } from "zod";
import type { Session } from "next-auth";
import type { TRPCContext } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Stripe } from "stripe";
import { eq } from "drizzle-orm";
import { env } from "~/env";
import { payments } from "~/server/db/schema";
import type {
	stripeItemSchema,
	updateStripeConnectOnBoardingInput,
} from "../schemas/payment";
import type { PaymentType } from "~/lib/enum";

type AccountServiceContructor = {
	ctx: TRPCContext;
};

type StripeFlowObject = {
	generateOnboardingLink: Stripe.AccountLink;
	newStripeAccount?: Stripe.Account;
	stripeAccountDB?: object;
};

type PaymentLinkConfig = {
	items: StripeItem[];
	currency: string;
	cancelUrl: string;
	successUrl: string;
	metadata: MetadataPayment;
};

type PaymentSubscriptionConfig = {
	lookupKeys: string[];
	successUrl: string;
	cancelUrl: string;
};

type ProcessPaymentInput = {
	data: {
		metadata: Stripe.Metadata | null;
		id: string;
		amount: number | null;
	};
};

type CreatePaymentInput = {
	userId: string;
	checkoutSessionId: string;
	paymentType: PaymentType;
};

export type MetadataPayment = {
	userId?: string;
	paymentType?: PaymentType;
};

export type StripeItem = z.infer<typeof stripeItemSchema>;
export type UpdateOnboardingInput = z.infer<
	typeof updateStripeConnectOnBoardingInput
>;

class PaymentService {
	ctx: TRPCContext;
	stripe = new Stripe(env.STRIPE_SECRET_KEY);

	constructor({ ctx }: AccountServiceContructor) {
		this.ctx = ctx;
	}

	async createStripeConnectAccount() {
		const newAccount = await this.stripe.accounts.create({
			type: "express",
		});

		return newAccount;
	}

	public async createPaymentLink(config: PaymentLinkConfig) {
		const customer = await this.stripe.customers.create();

		const session = await this.stripe.checkout.sessions.create({
			// line_items: listItems,
			mode: "payment",
			currency: "MXN",
			customer: customer.id,
			payment_method_types: ["card"],
			success_url: config.successUrl,
			cancel_url: config.cancelUrl,
			phone_number_collection: {
				enabled: false,
			},
			locale: "es",
			metadata: config.metadata,
		});

		return {
			paymentUrl: session.url,
		};
	}

	public async createPaymentSubscription(config: PaymentSubscriptionConfig) {
		const { lookupKeys, successUrl, cancelUrl } = config;
		const customer = await this.stripe.customers.create();
		const prices = await this.stripe.prices.list({ lookup_keys: lookupKeys });

		const session = await this.stripe.checkout.sessions.create({
			line_items: [
				{
					price: config.priceId,
				},
			],
			mode: "subscription",
			customer: customer.id,
			success_url: successUrl,
			cancel_url: cancelUrl,
		});

		return {
			paymentUrl: session.url,
		};
	}

	private async createPayment(input: CreatePaymentInput) {
		const [payment] = await this.ctx.db
			.insert(payments)
			.values({
				userId: input.userId,
				checkoutSessionId: input.checkoutSessionId,
				paymentType: input.paymentType,
				paymentIntentId: "test",
			})
			.returning();

		if (!payment) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "Payment was not created",
			});
		}

		return payment;
	}

	public async processPayment(paymentProcessInput: ProcessPaymentInput) {
		const { data } = paymentProcessInput;

		const { userId, paymentType } = data.metadata as MetadataPayment;

		if (!userId) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "UserId is required",
			});
		}

		if (!paymentType) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "paymentType is required",
			});
		}

		// const payment = await this.createPayment({
		// 	userId: userId,
		// 	checkoutSessionId: data.id,
		// 	paymentType,
		// });

		// switch (paymentType) {
		// 	case "BOOKING":
		// 		{
		// 			await this.onBookingPaymentSuccess();
		// 		}
		// 		break;
		// 	default:
		// 		break;
		// }
	}

	private async onBookingPaymentSuccess() {
		console.log("Payment booking success");
	}
}

export default PaymentService;
