import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { env } from "~/env";

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
	try {
		const session = await getServerSession(req, res, authOptions);

		if (!session) {
			return res.status(401).json({
				code: 401,
				message: "Must be logged in to access this resource",
			});
		}

		res.status(200).json({
			code: 200,
			credentials: {
				region: env.AWS_REGION,
				accessKeyId: env.AWS_ACCESS_KEY_ID,
				secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
			},
		});
	} catch (error) {
		console.error("[AI RETRIEVER CREDENTIALS]:", error);

		res.status(500).json({
			code: 500,
			message:
				"Something went wrong generating the onboarding stripe account url",
		});
	}
};

export default handler;
