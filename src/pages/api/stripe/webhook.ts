import type { Stripe } from "stripe";
import type { NextApiRequest, NextApiResponse } from "next";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const trpcContext = await createTRPCContext({
			req,
			res,
			info: { isBatchCall: false, calls: [] },
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
			case "account.updated":
				console.log(event.data.object.requirements);
				{
					if (
						event.data.object.requirements?.past_due &&
						event.data.object.requirements?.past_due.length !== 0
					) {
						//Stripe connect needs more information therefore onboarding is not completed
						await caller.payment.updateOnboarding({
							accountId: event.data.object.id,
							state: false,
						});
					} else {
						if (
							event.data.object.requirements?.currently_due &&
							event.data.object.requirements?.currently_due.length !== 0
						) {
							//Stripe connect needs more information therefore onboarding is not completed
							await caller.payment.updateOnboarding({
								accountId: event.data.object.id,
								state: false,
							});
						} else {
							//Onboarding is completed
							await caller.payment.updateOnboarding({
								accountId: event.data.object.id,
								state: true,
							});
						}
					}
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
