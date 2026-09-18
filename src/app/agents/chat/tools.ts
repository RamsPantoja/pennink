import { type InferUITool, tool, type ToolSet } from "ai";
import { aiFormSchema } from "./schema";
import type { createArtifactTool } from "./artifact";
import { z } from "zod";

export const generateAndEditForm = tool({
  description: "Tool for generating or editing forms and exams",
  inputSchema: aiFormSchema,
  execute: async ({ title, description, questions, type }) => ({
    title,
    description,
    questions,
    type,
  }),
});

export type GenerateAndEditFormTool = InferUITool<typeof generateAndEditForm>;

export const prepareSpeechText = tool({
  description:
    "Choose the concise text that should be spoken aloud for the user's request and your response. Include only the most useful explanation and requested details. Do not include markdown, code, headings, long lists, artifact contents, or meta-commentary. The visible response can be longer than this spoken text.",
  inputSchema: z.object({
    request: z.string().describe("The user's original request"),
    response: z.string().describe("The complete visible response you drafted"),
    text: z
      .string()
      .min(1)
      .max(20_000)
      .describe("The exact concise text to send to text-to-speech"),
  }),
  execute: async ({ text }) => ({ text: text.trim() }),
});

export type PrepareSpeechTextTool = InferUITool<typeof prepareSpeechText>;

export const createChatTools = ({
  artifact,
}: {
  artifact?: ReturnType<typeof createArtifactTool>;
}): ToolSet & { generateAndEditForm: typeof generateAndEditForm } => ({
  generateAndEditForm,
  ...(artifact ? { createArtifact: artifact } : {}),
});
