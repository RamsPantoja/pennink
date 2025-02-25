import { createMistral } from "@ai-sdk/mistral";
import { streamText } from "ai";

export async function POST(req: Request) {
	try {
		const mistral = createMistral();
		const model = mistral("mistral-large-latest", { safePrompt: true });
		const systemTemplate = `
		Analyze the user's input and determine the best way to present the response for clarity and readability. If the response involves steps, processes, or ordered information, use a numbered list. If the response consists of key points or related concepts, use bullet points. For sections or important topics, use headings. Maintain a logical structure and ensure that the formatting enhances understanding. Keep the tone engaging and tailored to the user's needs.
				"
			`;

		const { prompt } = await req.json();

		const result = streamText({
			model,
			system: systemTemplate,
			prompt,
		});

		return result.toTextStreamResponse();
	} catch (error) {
		return {
			code: 500,
			message: "Something went wrong generating the response",
		};
	}
}
