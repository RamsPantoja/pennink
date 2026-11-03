import type { FilePart, ImagePart, ModelMessage, ToolSet } from "ai";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getServerSession } from "next-auth";
import { env } from "~/env";
import {
  CHAT_ATTACHMENT_MAX_SIZE,
  CHAT_ATTACHMENT_PREFIX,
  isAllowedChatAttachmentType,
  type ChatAttachment,
} from "~/lib/chatAttachments";
import { createR2Client } from "~/server/api/services/storage";
import { authOptions } from "~/server/auth";
import type { Message } from "~/server/api/services/chat";
import { db } from "~/server/db";
import { userHasClassroom } from "~/server/api/services/classroom";
import { and, eq } from "drizzle-orm";
import { createChatAgent } from "~/app/agents/chat/agent";
import { createArtifactTool } from "~/app/agents/chat/artifact";
import {
  createSharedLinkTool,
  type ActiveForm,
} from "~/app/agents/chat/shared-link";
import { createChatTools, prepareSpeechText } from "~/app/agents/chat/tools";
import { createStudyPlanTool } from "~/app/agents/chat/study-plan";
import { createLessonPlannerTool } from "~/app/agents/lesson-planner/tool";
import { createClassroomStudentsTool } from "~/app/agents/chat/classroom-students";
import { createMindMapTool } from "~/app/agents/chat/mind-map";
import { askUserTool } from "~/app/agents/chat/ask-user";
import { cookies } from "next/headers";
import { LOCALE_COOKIE_NAME, getRequestLocale } from "~/lib/utils";

export type Context = {
  messages: ModelMessage[];
};

export type AgentChatRequestData = {
  prompt: string;
  context: Context;
  trigger: "submit-message";
  id: string;
  metadata: Message;
  activeForm?: ActiveForm | null;
  activeClassroomId?: string | null;
  attachments?: ChatAttachment[];
};

const toCurrentUserMessage = async (
  userId: string,
  prompt: string,
  attachments: ChatAttachment[],
): Promise<ModelMessage> => {
  if (attachments.length === 0) {
    return { role: "user", content: prompt };
  }

  const r2 = createR2Client();

  const attachmentParts = await Promise.all(
    attachments.map(
      async (attachment): Promise<ImagePart | FilePart> => {
        if (
          !attachment.key.startsWith(`${CHAT_ATTACHMENT_PREFIX}/${userId}/`) ||
          !isAllowedChatAttachmentType(attachment.mediaType)
        ) {
          throw new Error(`Invalid attachment: ${attachment.filename}`);
        }

        const object = await r2.send(
          new GetObjectCommand({ Bucket: env.BUCKET, Key: attachment.key }),
        );
        const data = await object.Body?.transformToByteArray();

        if (!data || data.byteLength > CHAT_ATTACHMENT_MAX_SIZE) {
          throw new Error(`Attachment unavailable: ${attachment.filename}`);
        }

        if (attachment.mediaType.startsWith("image/")) {
          return { type: "image", image: data, mediaType: attachment.mediaType };
        }

        return {
          type: "file",
          data,
          mediaType: attachment.mediaType,
          filename: attachment.filename,
        };
      },
    ),
  );

  return {
    role: "user",
    content: [
      ...(prompt ? [{ type: "text" as const, text: prompt }] : []),
      ...attachmentParts,
    ],
  };
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      throw new Error("Must be logged in to access");
    }

    if (!(await userHasClassroom(db, session.user.id))) {
      return Response.json(
        { message: "Create a classroom before chatting" },
        { status: 403 },
      );
    }

    const tools: ToolSet = {};

    const {
      context,
      prompt,
      metadata,
      activeForm,
      activeClassroomId,
      attachments = [],
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
    tools.createMindMap = createMindMapTool;
    tools.askUser = askUserTool;
    tools.shareClassroomLink = createSharedLinkTool({
      userId: session.user.id,
      locale: getRequestLocale(
        (await cookies()).get(LOCALE_COOKIE_NAME)?.value,
        req.headers.get("accept-language") ?? undefined,
      ),
      activeClassroomId,
      activeForm,
    });

    tools.manageStudyPlan = createStudyPlanTool({
      userId: session.user.id,
      activeClassroomId,
    });

    tools.lessonPlanner = createLessonPlannerTool({
      userId: session.user.id,
      activeClassroomId,
    });

    tools.listClassroomStudents = createClassroomStudentsTool({
      userId: session.user.id,
      activeClassroomId,
    });

    if (!context.messages) {
      throw new Error("Missing context messages");
    }

    // A resume sends the teacher's askUser answers as the last tool result, with no new prompt.
    const isResume =
      !prompt &&
      attachments.length === 0 &&
      context.messages.at(-1)?.role === "tool";

    if (!prompt && attachments.length === 0 && !isResume) {
      throw new Error("Missing prompt");
    }

    const messages = isResume
      ? context.messages
      : [
          ...context.messages,
          await toCurrentUserMessage(session.user.id, prompt, attachments),
        ];

    const result = await createChatAgent(tools).stream({ messages });

    // The last step's input size is the context the model actually received.
    let contextTokens = 0;

    return result.toUIMessageStreamResponse({
      messageMetadata: ({ part }) => {
        if (part.type === "finish-step") {
          contextTokens = part.usage.inputTokens ?? contextTokens;
        }

        if (part.type === "start") {
          return metadata;
        }

        if (part.type === "finish") {
          return { ...metadata, metadata: { contextTokens } };
        }
      },
    });
  } catch (error) {
    console.log(error);
    return Response.error();
  }
}
