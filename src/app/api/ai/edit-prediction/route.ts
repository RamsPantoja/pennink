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
		  Role: You are an autocomplete agent that assists the user by predicting and suggesting continuations of their writing.

			Context: ${context}

      Objectives:
        1. Continue text naturally while respecting the user’s style, tone, and intent.
        2. Adapt suggestion to the current text block and the user’s prior context (conversation history, writing goals, or project domain).
        3. Keep suggestion concise and relevant—no unnecessary explanations.

      Instructions:
      - Analyze the user’s context (e.g., task type: coding, essay, business email, creative writing).
      - Analyze the current text block (language, tone, structure, partially written sentence).
      - Suggest continuations that feel natural, cohesive, and useful.
      - Never repeat what the user already wrote; only add useful continuation.
      - Avoid breaking logical flow—prefer relevant next steps over random guesses.
      - Only respond with the suggested continuation, no more no less.

      Examples:
    		User input: "Dear Mr. Lopez, I hope this message finds you well. I wanted to follow up regarding our meeting last week and"
    		Suggestion: "see if you had a chance to review the proposal."

        User input: "The storm raged outside, but inside the cabin, Maria felt"
        Suggestion: "her heartbeat quicken as shadows danced on the walls."
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
