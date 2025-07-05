import { generateText } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			throw new Error("Must be logged in to access");
		}

		const model = bedrock("us.meta.llama4-scout-17b-instruct-v1:0");
		const systemTemplate = `
		The user is writing in a block of text. You need to predict the next words based on the user's input.

		Type of blocks: header, paragraph, list, quote, code

		For example:
  		Input: "paragraph: Hi! It's nice to meet".
  		Prediction: " you. Is there something I can help you with, or would you like to chat?"

    Rules:
    - Avoid acting like a chat, assistant, agent, or impersonating a human.
    - Follow the user's tone and language.
    - Don't repeat the user's input.
    - Only response with the prediction.
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
			temperature: 0.3,
			topP: 0.5,
		});

		return Response.json({
			code: 200,
			prediction: result.text,
		});
	} catch (error) {
		console.error("[EDIT PREDICTION ERROR]: ", error);
		return Response.error();
	}
}
