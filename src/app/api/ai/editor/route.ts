import { convertToModelMessages, streamText } from "ai";
import { toolDefinitionsToToolSet } from "@blocknote/xl-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { bedrock } from "@ai-sdk/amazon-bedrock";

export async function POST(req: Request) {
	const { messages, toolDefinitions } = await req.json();

	const session = await getServerSession(authOptions);

	if (!session) {
		throw new Error("Must be logged in to access");
	}

	const model = bedrock("openai.gpt-oss-120b-1:0");

	const result = streamText({
		model,
		messages: convertToModelMessages(messages),
		tools: toolDefinitionsToToolSet(toolDefinitions),
		toolChoice: "required",
	});

	return result.toUIMessageStreamResponse();
}
