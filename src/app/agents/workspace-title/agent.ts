import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { ToolLoopAgent } from "ai";
import { workspaceTitleSystemPrompt } from "./prompt";

const bedrock = createAmazonBedrock({
 region: process.env.AWS_REGION,
 accessKeyId: process.env.AWS_ACCESS_KEY_ID,
 secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export const workspaceTitleAgent = new ToolLoopAgent({
 model: bedrock("us.openai.gpt-5.6-luna"),
 instructions: workspaceTitleSystemPrompt,
});
