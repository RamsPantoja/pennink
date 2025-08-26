import {
	type ModelMessage,
	stepCountIs,
	streamText,
	tool,
	convertToModelMessages,
	type ToolSet,
	type UIMessage,
} from "ai-v5";
import { bedrock as bedrockV3 } from "bedrock-v3";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { aiFormSchema } from "~/lib/schemas/aiForm";
import { recipeSchema } from "~/lib/schemas/recipe";
import type { ChatModes } from "~/components/Chat/useChatLogic";

export type Context = {
	messages: ModelMessage[];
};

export type AgentChatRequestData = {
	prompt: string;
	context: Context;
	chatModes: ChatModes[];
	trigger: "submit-message";
	id: string;
};

export async function POST(req: Request) {
	try {
		// openai.gpt-oss-20b-1:0
		// openai.gpt-oss-120b-1:0
		// us.amazon.nova-pro-v1:0

		const session = await getServerSession(authOptions);

		if (!session) {
			throw new Error("Must be logged in to access");
		}

		const tools: ToolSet = {
			generateForm: tool({
				description: "Tool for generating forms and exams",
				inputSchema: aiFormSchema,
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

		const { context, prompt, chatModes } =
			(await req.json()) as AgentChatRequestData;

		const model = bedrockV3("openai.gpt-oss-120b-1:0");
		const systemTemplate = `
		You are a friendly and professional agent designed to engage users in natural, open-ended conversations. Your responses should be warm, engaging, and thoughtful, ensuring the conversation flows smoothly. Ask follow-up questions to keep the discussion dynamic, show genuine curiosity about the user's thoughts, and adapt your tone to match the user's communication style. Avoid sounding robotic or overly formal—aim for a conversational and approachable style while maintaining professionalism.
		Your goal is to make the user feel heard, understood, and comfortable sharing their thoughts.
		Detect the language of the user's input and respond accordingly.

		Capabilities:
		  1. Generate forms:
    		- Instructions:
      		- You are able to generate a form of type exam or basic.
      		- Basic forms are designed for simple data collection.
          - For open questions that require a detailed response, provide a space for the user to elaborate (textarea).
      		- Exam forms are designed for evaluating the user's knowledge and understanding, also, require to generate the correct answer for each question if needed and the form fields are not required by default.
    		- Rules:
      		- The user's instructions should be followed strictly, but not replacing the defined rules.
      		- The KEY question should be sequential, numerical and integer, starting from 1.

		`;

		if (!prompt) {
			throw new Error("Missing prompt");
		}

		if (!context.messages) {
			throw new Error("Missing context messages");
		}

		const result = streamText({
			model,
			system: systemTemplate,
			messages: [...context.messages, { role: "user", content: prompt }],
			temperature: 0.1,
			tools,
			stopWhen: stepCountIs(5), // Stop at step 5 if tools were called
			onError({ error }) {
				console.log(error); // your error logging logic here
			},
		});

		return result.toUIMessageStreamResponse({ sendReasoning: true });
	} catch (error) {
		console.log(error);
		return Response.error();
	}
}
