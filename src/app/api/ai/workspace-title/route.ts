import { google } from "@ai-sdk/google";
import { type LanguageModel, streamText } from "ai";

export async function POST(req: Request) {
	try {
		const model = google("gemini-2.0-flash-lite");
		const systemTemplate = `Generate a title for the user's input that is concise. Consider the context of the input and the user's needs. Use clear and descriptive language. Avoid overly technical terms or jargon. Keep the title within a reasonable length. Only response with the title.`;

		const { context } = await req.json();

		if (!context.messages) {
			throw new Error("Missing context messages");
		}

		const result = streamText({
			model,
			messages: [
				{ role: "system", content: systemTemplate },
				...context.messages,
				{
					role: "user",
					content: "Generate",
				},
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
