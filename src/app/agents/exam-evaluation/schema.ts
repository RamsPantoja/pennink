import { z } from "zod";

export const evaluationDetailsSchema = z.object({
 questions: z.array(
  z.object({
   key: z.string().describe("Question key, exactly as received"),
   score: z.number().min(0).max(100),
   feedback: z.string().describe("Short feedback for this question"),
  }),
 ),
 feedback: z.string().describe("Markdown feedback for the whole exam"),
});
