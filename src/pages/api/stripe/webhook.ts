import { Stripe } from "stripe";
import type { NextApiRequest, NextApiResponse } from "next";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import type { TRPCRequestInfo } from "@trpc/server/unstable-core-do-not-import";
import { env } from "~/env";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const trpcContext = await createTRPCContext({
			req,
			res,
			info: {} as TRPCRequestInfo,
		});

		const endpointSecret = env.STRIPE_ENDPOINT_SECRET;
		const signature = req.headers["stripe-signature"];
		const requestData = req.read();

		if (!requestData) {
			throw new Error("[STRIPE HOOK] Buffer is undefined???");
		}

		if (typeof signature !== "string") {
			throw new Error("[STRIPE HOOK] Header isn't a string???");
		}

		const event = Stripe.webhooks.constructEvent(
			requestData,
			signature,
			endpointSecret,
		);

		await trpcContext
			.services({ ctx: trpcContext })
			.paymentService.processEvent(event);

		return res.status(200).json({
			code: 200,
			message: "We have received the event and was processed",
		});
	} catch (error) {
		console.error("[STRIPE WEBHOOK]:", error);

		return res.status(500).json({
			code: 500,
			message:
				"Something went wrong generating the onboarding stripe account url",
		});
	}
};

export const config = {
	api: {
		bodyParser: false,
	},
};

export default handler;
