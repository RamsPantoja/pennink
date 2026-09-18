import { z } from "zod";

export const evaluationDetailsSchema = z.object({
 score: z.number().min(0).max(100),
 feedback: z.string().describe("Markdown feedback for the exam"),
});
