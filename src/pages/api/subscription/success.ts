import type { NextApiRequest, NextApiResponse } from "next";
import { createTRPCContext } from "~/server/api/trpc";
import type { TRPCRequestInfo } from "@trpc/server/unstable-core-do-not-import";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const session = await getServerSession(req, res, authOptions);

		if (!session) {
			return res.status(401).json({
				code: 401,
				message: "Must be logged in to access this page",
			});
		}

		const trpcContext = await createTRPCContext({
			req,
			res,
			info: {} as TRPCRequestInfo,
		});

		const customer = await trpcContext.db.query.customers.findFirst({
			where: (customers, { eq }) => {
				return eq(customers.userId, session.user.id);
			},
		});

		if (!customer) {
			return res.status(401).json({
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
		await getServerSession(req, res, authOptions);
		res.redirect("/");
	} catch (error) {
		console.error("[STRIPE SUCCESS SUBSCRIPTION]:", error);

		res.status(500).json({
			code: 500,
			message:
				"Something went wrong generating the onboarding stripe account url",
		});
	}
};

export default handler;
