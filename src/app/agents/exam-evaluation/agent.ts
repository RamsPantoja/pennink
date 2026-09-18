import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { stepCountIs, ToolLoopAgent } from "ai";
import { examEvaluationSystemPrompt } from "./prompt";
import { examEvaluationTools } from "./tools";

const bedrock = createAmazonBedrock({
 region: process.env.AWS_REGION,
 accessKeyId: process.env.AWS_ACCESS_KEY_ID,
 secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export const examEvaluationAgent = new ToolLoopAgent({
 model: bedrock("us.openai.gpt-5.6-luna"),
 instructions: examEvaluationSystemPrompt,
 tools: examEvaluationTools,
 toolChoice: { type: "tool", toolName: "getEvaluationDetails" },
 stopWhen: stepCountIs(5),
});
