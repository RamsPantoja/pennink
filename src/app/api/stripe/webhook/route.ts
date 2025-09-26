import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "~/env";
import { createTRPCContext } from "~/server/trpc";

export async function POST(req: Request) {
	try {
		const trpcContext = await createTRPCContext({ headers: req.headers });
		const endpointSecret = env.STRIPE_ENDPOINT_SECRET;
		const signature = req.headers.get("stripe-signature");
		const requestData = await req.text();

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

		return NextResponse.json({
			code: 200,
			message: "We have received the event and was processed",
		});
	} catch (error) {
		console.error("[STRIPE WEBHOOK]:", error);

		return NextResponse.json({
			code: 500,
			message:
				"Something went wrong generating the onboarding stripe account url",
		});
	}
}

export const config = {
	api: {
		bodyParser: false,
	},
};
