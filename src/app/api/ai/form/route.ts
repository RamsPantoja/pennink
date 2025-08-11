import { streamObject } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import z from "zod";
import { aiFormSchema } from "~/lib/schemas/aiForm";

export type FormAIData = {
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

		const model = bedrock("amazon.nova-pro-v1:0");
		const systemTemplate = `
		  Your task is to generate a form based on the provided schema, context and user's instructions. The form should include all the necessary fields and options as specified in the schema.

			Context: """${context}"""

			User Instructions: """${prompt}"""
	 `;

		const result = streamObject({
			system: systemTemplate,
			model,
			schema: aiFormSchema,
			prompt: "Generate the form",
		});

		return result.toTextStreamResponse();
	} catch (error) {
		console.error("[EDIT PREDICTION ERROR]: ", error);
		return Response.error();
	}
}
