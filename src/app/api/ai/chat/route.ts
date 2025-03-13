import { createMistral } from "@ai-sdk/mistral";
import { streamText } from "ai";

export async function POST(req: Request) {
	try {
		const mistral = createMistral();
		const model = mistral("mistral-large-latest", { safePrompt: true });
		const systemTemplate = `Analyze the user's input and determine the best way to present the response for clarity and readability. If the response involves steps, processes, or ordered information, use a numbered list. If the response consists of key points or related concepts, use bullet points. For sections or important topics, use headings. Maintain a logical structure and ensure that the formatting enhances understanding. Keep the tone engaging and tailored to the user's needs. Detect the language of the user's input and adjust the response accordingly.`;

		const { prompt, context } = await req.json();

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
