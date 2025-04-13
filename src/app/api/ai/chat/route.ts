import { mistral } from "@ai-sdk/mistral";
import { type CoreMessage, streamText } from "ai";

export type Context = {
	messages: CoreMessage[];
};

export type AgentChatRequestData = {
	prompt: string;
	context: Context;
};

export async function POST(req: Request) {
	try {
		const model = mistral("mistral-large-latest");
		const systemTemplate = `You are a friendly and professional AI designed to engage users in natural, open-ended conversations. Your responses should be warm, engaging, and thoughtful, ensuring the conversation flows smoothly. Ask follow-up questions to keep the discussion dynamic, show genuine curiosity about the user's thoughts, and adapt your tone to match the user's communication style. Avoid sounding robotic or overly formal—aim for a conversational and approachable style while maintaining professionalism. Your goal is to make the user feel heard, understood, and comfortable sharing their thoughts.`;

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
		});

		return result?.toTextStreamResponse();
	} catch (error) {
		console.log(error);
		return Response.json({
			code: 500,
			message: "Something went wrong generating the response",
		});
	}
}
