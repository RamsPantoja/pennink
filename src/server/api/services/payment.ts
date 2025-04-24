import type { z } from "zod";
import type { Session } from "next-auth";
import type { TRPCContext } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Stripe } from "stripe";
import { eq } from "drizzle-orm";
import { env } from "~/env";
import { customers, payments } from "~/server/db/schema";
import type {
	stripeItemSchema,
	updateStripeConnectOnBoardingInput,
} from "../schemas/payment";

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
	metadata: Stripe.Metadata | null;
	checkoutSessionId: string;
	amount: number | null;
	mode: Stripe.Checkout.Session.Mode;
};

type CreatePaymentInput = {
	userId: string;
	checkoutSessionId: string;
};

export type MetadataPayment = {
	userId?: string;
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

	public async createPaymentSubscriptionLink(
		config: PaymentSubscriptionConfig,
		userId: string,
	) {
		const { lookupKeys, successUrl, cancelUrl } = config;
		const customer = await this.verifyCustomer(userId);
		const prices = await this.stripe.prices.list({ lookup_keys: lookupKeys });

		const session = await this.stripe.checkout.sessions.create({
			line_items: prices.data.map((price) => {
				return {
					price: price.id,
					quantity: 1,
				};
			}),
			mode: "subscription",
			customer: customer.customerId,
			success_url: successUrl,
			cancel_url: cancelUrl,
		});

		if (!session.url) {
			throw new Error("Payment session URL not found");
		}

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
		const { metadata, checkoutSessionId, amount, mode } = paymentProcessInput;

		switch (mode) {
			case "payment":
				{
					const { userId } = metadata as MetadataPayment;

					if (!userId) {
						throw new TRPCError({
							code: "CONFLICT",
							message: "UserId is required",
						});
					}

					await this.createPayment({
						userId: userId,
						checkoutSessionId,
					});
				}
				break;
			case "subscription":
				{
					await this.createSubscription({
						userId: userId,
						checkoutSessionId,
					});
				}
				break;
			default:
				break;
		}
	}

	private async verifyCustomer(userId: string) {
		const user = await this.ctx.db.query.users.findFirst({
			where: (users, { eq }) => {
				return eq(users.id, userId);
			},
		});

		if (!user) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "User not found",
			});
		}

		const customer = await this.ctx.db.query.customers.findFirst({
			where: (customers, { eq }) => {
				return eq(customers.userId, userId);
			},
		});

		if (customer) {
			return customer;
		}

		//Create a new customer record by user in Stripe
		const stripeCustomerRecord = await this.stripe.customers.create({
			email: user?.email,
			name: user.name,
		});

		const [newCustomer] = await this.ctx.db
			.insert(customers)
			.values({
				userId,
				customerId: stripeCustomerRecord.id,
			})
			.returning();

		if (!newCustomer) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to create customer",
			});
		}

		return newCustomer;
	}
}

export default PaymentService;
