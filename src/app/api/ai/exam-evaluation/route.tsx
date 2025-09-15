import {
	type ModelMessage,
	stepCountIs,
	streamText,
	tool,
	type ToolSet,
} from "ai-v5";
import { bedrock as bedrockV3 } from "bedrock-v3";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { aiFormSchema } from "~/lib/schemas/aiForm";
import type { Tools } from "~/components/Chat/useChatLogic";
import type { Message } from "~/server/api/services/chat";
import { getEvaluationExamSystemPrompt } from "~/lib/prompts/evaluation-exam";

export type Context = {
	messages: ModelMessage[];
};

export type AgentChatRequestData = {
	prompt: string;
	context: Context;
	tools: Tools[];
	trigger: "submit-message";
	id: string;
	metadata: Message;
};

export async function POST(req: Request) {
	try {
		// openai.gpt-oss-20b-1:0
		// openai.gpt-oss-120b-1:0
		// us.amazon.nova-pro-v1:0
		// us.meta.llama4-scout-17b-instruct-v1:0

		const session = await getServerSession(authOptions);

		if (!session) {
			throw new Error("Must be logged in to access");
		}

		const tools: ToolSet = {};

		const {
			context,
			prompt,
			tools: toolsAllowed,
			metadata,
		} = (await req.json()) as AgentChatRequestData;

		for (const toolKey of toolsAllowed) {
			switch (toolKey) {
				case "form-generation":
					tools.generateAndEditForm = tool({
						description: "Tool for generating or editing forms and exams",
						inputSchema: aiFormSchema,
						execute: async ({ title, description, questions, type }) => {
							return {
								title,
								description,
								questions,
								type,
							};
						},
					});
					break;
				default:
					break;
			}
		}

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
			prompt: `Evaluate the following exam responses: ${JSON.stringify(
				questionsWithCorrectAnswers,
			)} and ${JSON.stringify(answers)}`,
			stopWhen: stepCountIs(5), // Stop at step 5 if tools were called
			onError({ error }) {
				console.log(error); // your error logging logic here
			},
		});

		return result.toUIMessageStreamResponse({
			messageMetadata: ({ part }) => {
				if (part.type === "start") {
					return metadata;
				}
			},
		});
	} catch (error) {
		console.log(error);
		return Response.error();
	}
}
