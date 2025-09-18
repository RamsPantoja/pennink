import {
	type ModelMessage,
	stepCountIs,
	streamText,
	type ToolSet,
} from "ai-v5";
import { bedrock as bedrockV3 } from "bedrock-v3";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { getEvaluationExamSystemPrompt } from "~/lib/prompts/evaluation-exam";
import { evaluationDetails } from "~/lib/aiTools/getEvaluationDetails";

export type Context = {
	messages: ModelMessage[];
};

export type AgentChatRequestData = {
	prompt: string;
	context: Context;
};

const tools: ToolSet = {
	getEvaluationDetails: evaluationDetails,
};

export async function POST(req: Request) {
	try {
		const { context, prompt } = (await req.json()) as AgentChatRequestData;

		const model = bedrockV3("openai.gpt-oss-120b-1:0");

		if (!prompt) {
			throw new Error("Missing prompt");
		}

		if (!context.messages) {
			throw new Error("Missing context messages");
		}

		const result = streamText({
			model,
			system: getEvaluationExamSystemPrompt(),
			temperature: 0.1,
			tools,
			toolChoice: { type: "tool", toolName: "getEvaluationDetails" },
			prompt: prompt,
			stopWhen: stepCountIs(5), // Stop at step 5 if tools were called
			onError({ error }) {
				console.log(error); // your error logging logic here
			},
		});

		return result.toUIMessageStreamResponse();
	} catch (error) {
		console.log(error);
		return Response.error();
	}
}
