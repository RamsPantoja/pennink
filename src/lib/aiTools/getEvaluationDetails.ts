import { type InferUITool, tool } from "ai-v5";
import z from "zod";

const schema = z.object({
	score: z.number().min(0).max(100),
	feedback: z.string().describe("Markdown feedback for the exam"),
});

export const evaluationDetails = tool({
	description:
		"Tool for extracting the score and feedback from the exam evaluation once the evaluation is complete",
	inputSchema: schema,
	execute: async ({ score, feedback }) => {
		return {
			score,
			feedback,
		};
	},
});

export type EvaluationDetailsTool = InferUITool<typeof evaluationDetails>;
