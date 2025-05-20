import { type LanguageModel, streamText } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";

export async function POST(req: Request) {
	try {
		const model = bedrock("us.meta.llama4-scout-17b-instruct-v1:0");
		const systemTemplate = `Generate a title for the user's input that is concise.
		Consider the context of the input and the user's needs, if exist context.
		Use clear and descriptive language.
		Avoid overly technical terms or jargon.
		Keep the title within a reasonable length.
		Only response with the title.`;

		const { context } = await req.json();

		if (!context.messages) {
			throw new Error("Missing context messages");
		}

		const result = streamText({
			model,
			messages: [
				{ role: "system", content: systemTemplate },
				...context.messages,
			],
		});

		return result.toTextStreamResponse();
	} catch (error) {
		console.error("[WORKSPACE TITLE GENERATION ERROR]: ", error);
		return Response.json({
			code: 500,
			message: "Something went wrong generating the response",
		});
	}
}
