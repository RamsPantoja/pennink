import type { Stripe } from "stripe";
import type { NextApiRequest, NextApiResponse } from "next";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";
import type { TRPCRequestInfo } from "@trpc/server/unstable-core-do-not-import";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const trpcContext = await createTRPCContext({
			req,
			res,
			info: {} as TRPCRequestInfo,
		});

		const caller = createCaller(trpcContext);
		const event = req.body as Stripe.Event;

		switch (event.type) {
			case "checkout.session.completed":
				{
					//Card payment
					if (event.data.object.payment_status === "paid") {
						await caller.payment.paymentProcess({
							metadata: event.data.object.metadata,
							id: event.data.object.id,
							amount: event.data.object.amount_subtotal,
						});
					}
				}
				break;
			case "checkout.session.async_payment_succeeded":
				{
					//Transaction payment
					await caller.payment.paymentProcess({
						metadata: event.data.object.metadata,
						id: event.data.object.id,
						amount: event.data.object.amount_subtotal,
					});
				}
				break;
			default:
				break;
		}

		return res.status(200).json({
			code: 200,
			message: "We have received the event and are processing it",
		});
	} catch (error) {
		console.log(error);

		return res.status(500).json({
			code: 500,
			message:
				"Something went wrong generating the onboarding stripe account url",
		});
	}
};

export default handler;
