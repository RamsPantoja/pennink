import { generateText } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";

export type EditPredictionData = {
	prompt: string;
	context: string;
};

export async function POST(req: Request) {
	try {
		const session = await getServerSession(authOptions);

		if (!session) {
			throw new Error("Must be logged in to access");
		}

		const { prompt, context } = await req.json();

		const model = bedrock("us.meta.llama4-scout-17b-instruct-v1:0");
		const systemTemplate = `
		The user is writing in a block of text. Give to the user a suggestion based on the user's input.

		Document context: ${context}

		Type of blocks: header, paragraph, list, quote, code

		Example:
  		Input: "paragraph: Hi! It's nice to meet ".
  		Prediction: "you. Is there something I can help you with, or would you like to chat?"

    Rules:
    1. Avoid acting like a bot, assistant, agent, or impersonating a human.
    2. Follow the user's tone and language.
    3. Don't repeat the user's input.
    4. Only response with the prediction.
    5. Add a white space at the start of your prediction if needed.
    6. Use the context to provide a relevant suggestion.
	 `;

		const result = await generateText({
			model,
			system: systemTemplate,
			prompt,
			temperature: 0.3,
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
