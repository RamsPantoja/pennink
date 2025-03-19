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

	async newAccountLink(accountId: string) {
		const accountLink = await this.stripe.accountLinks.create({
			account: accountId,
			refresh_url: `${env.NEXTAUTH_URL}/api/stripe/connect/refresh`,
			return_url: `${env.NEXTAUTH_URL}/payouts`,
			type: "account_onboarding",
			collection_options: {
				fields: "currently_due",
			},
		});

		if (!accountLink) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Internal server error",
			});
		}

		return accountLink;
	}

	private parseStripeItems(items: StripeItem[], currency: string) {
		return items.map((item: StripeItem) => {
			return {
				price_data: {
					currency,
					unit_amount: Number.parseFloat((item.unitPrice * 100).toFixed(2)),
					product_data: {
						name: item.concept,
					},
				},
				quantity: item.quantity,
			};
		});
	}

	private computeFee(items: StripeItem[]): number {
		const percentFee = 0.04;
		const totalPrice = items.reduce<number>((acc, item) => {
			return acc + item.unitPrice * item.quantity;
		}, 0);

		if (totalPrice && totalPrice >= 0) {
			return totalPrice * percentFee;
		}

		return 0;
	}

	public async createPaymentLink(config: PaymentLinkConfig) {
		const customer = await this.stripe.customers.create();
		const listItems = this.parseStripeItems(config.items, config.currency);

		const session = await this.stripe.checkout.sessions.create({
			line_items: listItems,
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
