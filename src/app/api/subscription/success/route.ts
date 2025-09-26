import { NextResponse } from "next/server";
import { getServerAuthSession } from "~/server/auth";
import { createTRPCContext } from "~/server/trpc";

export async function GET(req: Request) {
	try {
		const session = await getServerAuthSession();

		if (!session) {
			return NextResponse.json({
				code: 200,
				message: "Must be logged in to access this page",
			});
		}

		const trpcContext = await createTRPCContext({ headers: req.headers });

		const customer = await trpcContext.db.query.customers.findFirst({
			where: (customers, { eq }) => {
				return eq(customers.userId, session.user.id);
			},
		});

		if (!customer) {
			return NextResponse.json({
				code: 401,
				message: "[UNAUTHORIZED]: Customer not found for logged in user",
			});
		}

		async function fetchUntilChanged(customerId: string, userId: string) {
			while (true) {
				const subscription = await trpcContext.db.query.subscriptions.findFirst(
					{
						where: (subscriptions, { eq, and }) => {
							return and(
								eq(subscriptions.customerId, customerId),
								eq(subscriptions.status, "active"),
								eq(subscriptions.userId, userId),
							);
						},
					},
				);

				if (subscription) {
					return; //Returns after the subscription is found
				}

				await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 5 seconds before next attempt
			}
		}

		await fetchUntilChanged(customer.customerId, session.user.id);
		await getServerAuthSession();
		return NextResponse.redirect("/");
	} catch (error) {
		console.error("[STRIPE SUCCESS SUBSCRIPTION]:", error);

		return NextResponse.json({
			code: 500,
			message:
				"Something went wrong generating the onboarding stripe account url",
		});
	}
}
