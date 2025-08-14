import { type CoreMessage, streamText, tool, ToolSet } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { aiFormSchema } from "~/lib/schemas/aiForm";

export type Context = {
	messages: CoreMessage[];
};

export type AgentChatRequestData = {
	prompt: string;
	context: Context;
};

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			throw new Error("Must be logged in to access");
		}

		const tools: ToolSet = {
			generateForm: tool({
				description: "Tool for generating forms and exams",
				parameters: aiFormSchema,
				execute: async ({ title, description, questions, type }) => {
					return {
						title,
						description,
						questions,
						type,
					};
				},
			}),
		};

		const model = bedrock("openai.gpt-oss-20b-1:0"); //openai.gpt-oss-20b-1:0, openai.gpt-oss-120b-1:0
		const systemTemplate = `
		You are a friendly and professional agent designed to engage users in natural, open-ended conversations. Your responses should be warm, engaging, and thoughtful, ensuring the conversation flows smoothly. Ask follow-up questions to keep the discussion dynamic, show genuine curiosity about the user's thoughts, and adapt your tone to match the user's communication style. Avoid sounding robotic or overly formal—aim for a conversational and approachable style while maintaining professionalism.
		Your goal is to make the user feel heard, understood, and comfortable sharing their thoughts.
		Detect the language of the user's input and respond accordingly.

		Capabilities:
		  1. Generate forms:
    		- Instructions:
      		- You are able to generate a form of type exam or basic.
      		- Basic forms are designed for simple data collection.
      		- Exam forms are designed for evaluating the user's knowledge and understanding, also, require to generate the correct answer for each question only if the question needs it.
    		- Rules:
      		- The user's instructions should be followed strictly, but not replacing the defined rules.
      		- The ID question should be sequential, numerical and integer, starting from 1.

		`;

		const { prompt, context } = (await req.json()) as AgentChatRequestData;

		if (!prompt) {
			throw new Error("Missing prompt");
		}

		if (!context.messages) {
			throw new Error("Missing context messages");
		}

		const result = streamText({
			model,
			system: systemTemplate,
			messages: [
				...context.messages,
				{
					role: "user",
					content: prompt,
				},
			],
			temperature: 0.5,
			maxSteps: 5,
			tools,
		});

		return result.toDataStreamResponse();
	} catch (error) {
		console.log(error);
		return Response.error();
	}
}
