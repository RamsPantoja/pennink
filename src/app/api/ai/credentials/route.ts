import { getServerAuthSession } from "~/server/auth";
import { env } from "~/env";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
	try {
		const session = await getServerAuthSession();

		if (!session) {
			return NextResponse.json({
				code: 401,
				message: "Must be logged in to access this resource",
			});
		}

		return NextResponse.json({
			code: 200,
			credentials: {
				region: env.AWS_REGION,
				accessKeyId: env.AWS_ACCESS_KEY_ID,
				secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
			},
		});
	} catch (error) {
		console.error("[AI RETRIEVER CREDENTIALS]:", error);

		return NextResponse.json({
			code: 500,
			message:
				"Something went wrong generating the onboarding stripe account url",
		});
	}
}
