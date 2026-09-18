import type { ModelMessage, ToolSet } from "ai";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import type { Tools } from "~/components/Chat/useChatLogic";
import type { Message } from "~/server/api/services/chat";
import { db } from "~/server/db";
import { and, eq } from "drizzle-orm";
import { createChatAgent } from "~/app/agents/chat/agent";
import { createArtifactTool } from "~/app/agents/chat/artifact";
import { createChatTools, prepareSpeechText } from "~/app/agents/chat/tools";

export type Context = {
  messages: ModelMessage[];
};

export type AgentChatRequestData = {
  prompt: string;
  context: Context;
  tools: Tools[];
  trigger: "submit-message";
  id: string;
  metadata: Message;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      throw new Error("Must be logged in to access");
    }

    const tools: ToolSet = {};

    const {
      context,
      prompt,
      tools: toolsAllowed,
      metadata,
    } = (await req.json()) as AgentChatRequestData;

    tools.prepareSpeechText = prepareSpeechText;
    const workspace = await db.query.workspaces.findFirst({
      where: (table) =>
        and(
          eq(table.chatId, metadata.chatId),
          eq(table.userId, session.user.id),
        ),
    });
    tools.createArtifact = createArtifactTool({
      userId: session.user.id,
      workspaceId: workspace?.id,
      chatId: metadata.chatId,
    });
    tools.generateAndEditForm = createChatTools({}).generateAndEditForm;

    if (!prompt) {
      throw new Error("Missing prompt");
    }

    if (!context.messages) {
      throw new Error("Missing context messages");
    }

    const result = await createChatAgent(tools).stream({
      messages: [...context.messages, { role: "user", content: prompt }],
    });

    return result.toUIMessageStreamResponse({
      messageMetadata: ({ part }) => {
        if (part.type === "start") {
          return metadata;
        }
      },
    });
  } catch (error) {
    console.log(error);
    return Response.error();
  }
}
