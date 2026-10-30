import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { generateObject } from "ai";
import { examEvaluationSystemPrompt } from "./prompt";
import { evaluationDetailsSchema } from "./schema";

const bedrock = createAmazonBedrock({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export const gradeOpenQuestions = async (openQuestions: unknown[]) => {
  const { object } = await generateObject({
    model: bedrock("us.openai.gpt-6-luna"),
    system: examEvaluationSystemPrompt,
    schema: evaluationDetailsSchema,
    prompt: `Evaluate the following open-ended exam answers and return the score and feedback for each question. Questions: ${JSON.stringify(openQuestions)}`,
  });

  return object;
};
