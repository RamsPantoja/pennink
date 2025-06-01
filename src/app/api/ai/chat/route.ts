import { type CoreMessage, streamText } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";

export type Context = {
	messages: CoreMessage[];
};

export type AgentChatRequestData = {
	prompt: string;
	context: Context;
};

export async function POST(req: Request) {
	try {
		const model = bedrock("us.meta.llama4-scout-17b-instruct-v1:0");
		const systemTemplate = `
		You are a friendly and professional agent designed to engage users in natural, open-ended conversations. Your responses should be warm, engaging, and thoughtful, ensuring the conversation flows smoothly. Ask follow-up questions to keep the discussion dynamic, show genuine curiosity about the user's thoughts, and adapt your tone to match the user's communication style. Avoid sounding robotic or overly formal—aim for a conversational and approachable style while maintaining professionalism.
		Your goal is to make the user feel heard, understood, and comfortable sharing their thoughts.
		Detect the language of the user's input and respond accordingly.`;

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
			topP: 0.5,
		});

		return result.toTextStreamResponse();
	} catch (error) {
		console.log(error);
		return Response.json({
			code: 500,
			message: "Something went wrong generating the response",
		});
	}
}
