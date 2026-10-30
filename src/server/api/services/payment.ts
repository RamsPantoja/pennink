import type { z } from "zod";
import type { Session } from "next-auth";
import type { TRPCContext } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { Stripe } from "stripe";
import { and, eq } from "drizzle-orm";
import { env } from "~/env";
import { customers, payments, subscriptions, users } from "~/server/db/schema";
import type {
	stripeItemSchema,
	updateStripeConnectOnBoardingInput,
} from "../schemas/payment";
import type { Subscription } from "~/lib/enum";
import EmailService from "./email";
import {
	getPaymentFailedSubject,
	renderPaymentFailedEmail,
} from "~/emails/payment-failed";
import { isLocale } from "~/lib/utils";

export type StripeProductKey = "PENNINK_PRO" | "PENNINK_PREMIUM";
type Customer = typeof customers.$inferSelect;

type AccountServiceContructor = {
	ctx: TRPCContext;
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
	emailService: EmailService;
	stripe = new Stripe(env.STRIPE_SECRET_KEY);

	constructor({ ctx }: AccountServiceContructor) {
		this.ctx = ctx;
		this.emailService = new EmailService({ ctx });
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
							await this.createSubscription(subscription);
						}
					}
				}

				break;
			//Recurring payments, subscriptions and invoices
			case "invoice.payment_failed":
				{
					await this.onPaymentFailed(event.data.object);
				}
				break;
			case "customer.subscription.deleted":
				{
					const subscription = event.data.object;
					await this.cancelSubscription(subscription);
				}
				break;
			case "customer.subscription.updated":
				{
					const subscription = event.data.object;
					await this.syncStripeSubToDB(subscription);
				}
				break;
			default:
				break;
		}
	}

	private async onPaymentFailed(invoice: Stripe.Invoice) {
		const { customer: customerId } = invoice;

		if (typeof customerId !== "string") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Invalid customer ID: Customer ID must be a string",
			});
		}

		const customer = await this.ctx.db.query.customers.findFirst({
			where: eq(customers.customerId, customerId),
			with: {
				user: true,
			},
		});

		if (!customer) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "User not found",
			});
		}

		const locale = isLocale(customer.user.locale) ? customer.user.locale : "es";

		await this.emailService.send({
			to: [customer.user.email],
			from: "Pennink <no-reply@pennink.xyz>",
			subject: getPaymentFailedSubject(locale),
			html: await renderPaymentFailedEmail({
				locale,
				settingsUrl: `${env.NEXTAUTH_URL}/settings`,
				recipientEmail: customer.user.email,
			}),
		});
	}

	private async cancelSubscription(subscriptionData: Stripe.Subscription) {
		const sub = await this.syncStripeSubToDB(subscriptionData);

		await this.ctx.db
			.update(users)
			.set({
				subscription: "FREE",
			})
			.where(eq(users.id, sub.userId));
	}

	private async createSubscription(subscriptionData: Stripe.Subscription) {
		const { items } = subscriptionData;

		for await (const item of items.data) {
			const { price } = item;
			const productId = price.product;

			if (typeof productId !== "string") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Invalid product: Product ID must be a string to set the correct product subscription",
				});
			}

			const product = await this.stripe.products.retrieve(productId);
			const productKey = product.metadata.product_key;

			if (!productKey) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message:
						"Invalid product: Product key is missing and it is required to set the correct product subscription",
				});
			}

			const sub = await this.syncStripeSubToDB(subscriptionData);

			const availableSubscriptionsByProduct: Record<
				StripeProductKey,
				Subscription
			> = {
				PENNINK_PRO: "PRO",
				PENNINK_PREMIUM: "PREMIUM",
			};

			await this.ctx.db
				.update(users)
				.set({
					subscription:
						availableSubscriptionsByProduct[productKey as StripeProductKey],
				})
				.where(eq(users.id, sub.userId));
		}
	}

	private async syncStripeSubToDB(sub: Stripe.Subscription) {
		const { customer: customerId } = sub;

		if (typeof customerId !== "string") {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Invalid customer ID: Customer ID must be a string",
			});
		}

		const customer = await this.ctx.db.query.customers.findFirst({
			where: (customers, { eq }) => {
				return eq(customers.customerId, customerId);
			},
		});

		if (!customer) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Customer record not found in Pennink DB",
			});
		}

		const subscriptionInDB = await this.ctx.db.query.subscriptions.findFirst({
			where: (subscriptions, { eq, and }) => {
				return and(
					eq(subscriptions.subscriptionId, sub.id),
					eq(subscriptions.customerId, customer.customerId),
					eq(subscriptions.userId, customer.userId),
				);
			},
		});

		if (subscriptionInDB) {
			const [subscription] = await this.ctx.db
				.update(subscriptions)
				.set({
					status: sub.status,
					currentPeriodEnd: sub.current_period_end.toString(),
					currentPeriodStart: sub.current_period_start.toString(),
					cancelAtPeriodEnd: sub.cancel_at_period_end,
				})
				.where(
					and(
						eq(subscriptions.subscriptionId, sub.id),
						eq(subscriptions.customerId, customer.customerId),
						eq(subscriptions.userId, customer.userId),
					),
				)
				.returning();

			if (!subscription) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to update subscription in Pennink DB",
				});
			}

			return subscription;
		}

		const [subscription] = await this.ctx.db
			.insert(subscriptions)
			.values({
				userId: customer.userId,
				customerId: customer.customerId,
				subscriptionId: sub.id,
				status: sub.status,
				currentPeriodEnd: sub.current_period_end.toString(),
				currentPeriodStart: sub.current_period_start.toString(),
				cancelAtPeriodEnd: sub.cancel_at_period_end,
			})
			.returning();

		if (!subscription) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to create subscription in Pennink DB",
			});
		}

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

	public async generateCustomerPortalLink(userId: string) {
		const customer = await this.ctx.db.query.customers.findFirst({
			where: (customers, { eq }) => {
				return eq(customers.userId, userId);
			},
		});

		if (!customer) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message:
					"You are not authorized to access this feature or don't have a customer account",
			});
		}

		const portalSession = await this.stripe.billingPortal.sessions.create({
			customer: customer.customerId,
			return_url: `${env.NEXT_PUBLIC_BASE_URL}/settings`,
		});

		return portalSession.url;
	}
}

export default PaymentService;
