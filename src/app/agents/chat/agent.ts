import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { ToolLoopAgent, type ToolSet } from "ai";
import { chatSystemPrompt } from "./prompt";

const bedrock = createAmazonBedrock({
  region: process.env.AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

export const createChatAgent = (tools: ToolSet) =>
  new ToolLoopAgent({
    model: bedrock("us.openai.gpt-6-luna"),
    instructions: chatSystemPrompt,
    tools,
  });
