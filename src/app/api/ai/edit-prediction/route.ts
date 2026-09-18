import { createEditPredictionAgent } from "~/app/agents/edit-prediction/agent";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";

export type EditPredictionData = {
	prompt: string;
	context: string;
};

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			throw new Error("Must be logged in to access");
		}

		const { prompt, context } = await req.json();

		const result = await createEditPredictionAgent(context).generate({ prompt });

		return Response.json({
			code: 200,
			prediction: result.text,
		});
	} catch (error) {
		console.error("[EDIT PREDICTION ERROR]: ", error);
		return Response.error();
	}
}
