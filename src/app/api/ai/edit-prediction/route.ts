import { generateText, type LanguageModel } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";

export async function POST(req: Request) {
	try {
		const model = bedrock("us.meta.llama4-scout-17b-instruct-v1:0");
		const systemTemplate = `You are a friendly and professional writing agent to help users improve their spelling, writing, speed, and messaging.
		The user is writing in a block of text. You need to predict the next words based on the context.
		Try to be concise and follow the user's tone. Only response with the prediction no more no less.`;

		const { prompt } = await req.json();

		const result = await generateText({
			model,
			messages: [
				{ role: "system", content: systemTemplate },
				{
					role: "user",
					content: prompt,
				},
			],
		});

		return Response.json({
			code: 200,
			prediction: result.text,
		});
	} catch (error) {
		console.error("[WORKSPACE TITLE GENERATION ERROR]: ", error);
		return Response.json({
			code: 500,
			message: "Something went wrong generating the response",
		});
	}
}
