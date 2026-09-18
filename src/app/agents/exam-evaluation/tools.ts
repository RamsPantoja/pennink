import { type InferUITool, tool, type ToolSet } from "ai";
import { evaluationDetailsSchema } from "./schema";

export const evaluationDetails = tool({
 description: "Tool for extracting the score and feedback after the exam evaluation is complete",
 inputSchema: evaluationDetailsSchema,
 execute: async ({ score, feedback }) => ({ score, feedback }),
});

export const examEvaluationTools: ToolSet = {
 getEvaluationDetails: evaluationDetails,
};

export type EvaluationDetailsTool = InferUITool<typeof evaluationDetails>;
