import { type ModelMessage } from "ai";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { examEvaluationAgent } from "~/app/agents/exam-evaluation/agent";

export type Context = {
	messages: ModelMessage[];
};

export type AgentChatRequestData = {
	prompt: string;
	context: Context;
};

export async function POST(req: Request) {
	try {
		const { context, prompt } = (await req.json()) as AgentChatRequestData;

		if (!prompt) {
			throw new Error("Missing prompt");
		}

		if (!context.messages) {
			throw new Error("Missing context messages");
		}

		const result = await examEvaluationAgent.stream({ prompt });

		return result.toUIMessageStreamResponse();
	} catch (error) {
		console.log(error);
		return Response.error();
	}
}
