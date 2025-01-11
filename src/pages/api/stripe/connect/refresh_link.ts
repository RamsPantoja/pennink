import type { NextApiRequest, NextApiResponse } from "next";
import { createCaller } from "~/server/api/root";
import { createTRPCContext } from "~/server/api/trpc";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	const trpcContext = await createTRPCContext({
		req,
		res,
		info: { isBatchCall: false, calls: [] },
	});

	const caller = createCaller(trpcContext);

	try {
		const stripeAccount = await caller.payment.stripeAccountByUserId();

		if (!stripeAccount) {
			throw new Error("Stripe account not created for this user");
		}

		const accountLink = await caller.payment.newAccountLink({
			accountId: stripeAccount?.accountId,
		});

		if (accountLink) {
			return res.redirect(accountLink.url);
		}
	} catch (e) {
		console.log(e);

		return res.json({
			code: 500,
			message:
				"Something went wrong generating the onboarding stripe account url",
		});
	}
};

export default handler;
