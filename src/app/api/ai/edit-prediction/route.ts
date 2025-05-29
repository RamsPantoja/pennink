import { generateText } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";

export async function POST(req: Request) {
	try {
		const model = bedrock("us.meta.llama4-scout-17b-instruct-v1:0");
		const systemTemplate = `
		The user is writing in a block of text. You need to predict the next words based on the user's input.

		Type of blocks: header, paragraph, list, quote, code

		For example:
  		Input: "paragraph: Hi! It's nice to mee".
  		Suggestion: "t you. Is there something I can help you with, or would you like to chat?"
  		Full completion: "Hi! It's nice to meet you. Is there something I can help you with, or would you like to chat?"

    Rules:
    - Avoid acting like a chat, assistant, agent, or impersonating a human.
    - Follow the user's tone and language.
    - Help the user improve their writing and fix any errors.
    - Only return the full completion, without any additional text, markdown or HTML.
	 `;

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
