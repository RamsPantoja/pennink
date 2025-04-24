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
			subscription_data: {
				metadata: {
					userId,
				},
			},
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

	public async processEvent(event: Stripe.Event) {
		const { type, data } = event;
		console.log(type);

		switch (event.type) {
			//Basic payments
			case "checkout.session.completed":
				break;
			//Recurring payments, subscriptions and invoices
			case "invoice.paid":
				{
					const { subscription: subscriptionId } = event.data.object;

					if (typeof subscriptionId === "string") {
						const subscription =
							await this.stripe.subscriptions.retrieve(subscriptionId);

						if (!subscription) {
							throw new TRPCError({
								code: "NOT_FOUND",
								message: "[INVOICE PAID] Error: Subscription not found",
							});
						}

						if (subscription.status === "active") {
						}
					}
				}

				break;
			//Recurring payments, subscriptions and invoices
			case "invoice.payment_failed":
				{
					console.log(event.data.object);
				}
				// The payment failed or the customer does not have a valid payment method.
				// The subscription becomes past_due. Notify your customer and send them to the
				// customer portal to update their payment information.
				break;
			default:
				break;
		}
	}

	private async createSubscription(userId: string, priceId: string) {
		const customer = await this.verifyCustomer(userId);

		const subscription = await this.stripe.subscriptions.create({
			customer: customer.stripeId,
			items: [{ price: priceId }],
			expand: ["latest_invoice.payment_intent"],
		});

		await this.ctx.db.insert(subscriptions).values({
			stripeId: subscription.id,
			priceId: subscription.items.data[0].price.id,
			customerId: customer.id,
			status: subscription.status,
		});

		return subscription;
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
