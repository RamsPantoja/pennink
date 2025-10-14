import { type ModelMessage, stepCountIs, streamText, type ToolSet } from "ai";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { getServerSession } from "next-auth";
import { authOptions } from "~/server/auth";
import { generateAndEditForm } from "~/lib/aiTools/form";
import type { Tools } from "~/components/Chat/useChatLogic";
import type { Message } from "~/server/api/services/chat";
import { toolDefinitionsToToolSet } from "@blocknote/xl-ai";

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
		// openai.gpt-oss-20b-1:0
		// openai.gpt-oss-120b-1:0
		// us.amazon.nova-pro-v1:0
		// us.meta.llama4-scout-17b-instruct-v1:0

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

		for (const toolKey of toolsAllowed) {
			switch (toolKey) {
				case "form-generation":
					tools.generateAndEditForm = generateAndEditForm;
					break;
				default:
					break;
			}
		}

		const model = bedrock("openai.gpt-oss-120b-1:0");
		const systemTemplate = `
		You are a friendly and professional agent designed to engage users in natural, open-ended conversations. Your responses should be warm, engaging, and thoughtful, ensuring the conversation flows smoothly. Ask follow-up questions to keep the discussion dynamic, show genuine curiosity about the user's thoughts, and adapt your tone to match the user's communication style. Avoid sounding robotic or overly formal—aim for a conversational and approachable style while maintaining professionalism.
		Your goal is to make the user feel heard, understood, and comfortable sharing their thoughts.


		Instructions:
		  1. Detect the language of the user's input and respond accordingly.
			2. When responding with mathematical expressions use the following delimiters:
			  - Writing inline expressions uses "$" delimiters to show math inline: $\sqrt{3x-1}+(1+x)^2$
        - Writing block expressions uses "$$" delimiters to show math block: $$\left( \sum_{k=1}^n a_k b_k \right)^2 \leq \left( \sum_{k=1}^n a_k^2 \right) \left( \sum_{k=1}^n b_k^2 \right)$$

		Capabilities:
		  1. Generate forms:
    		- Instructions:
      		- You are able to generate a form of type exam or basic.
      		- Basic forms are designed for simple data collection.
          - For open questions that require a detailed response, provide a space for the user to elaborate (textarea).
      		- Exam forms are designed for evaluating the user's knowledge and understanding, also, require to generate the correct answer for each question if needed and the form fields are not required by default.
    		- Rules:
      		- The user's instructions should be followed strictly, but not replacing the defined rules.
      		- The KEY question should be sequential, numerical and integer, starting from 1.
		`;

		if (!prompt) {
			throw new Error("Missing prompt");
		}

		if (!context.messages) {
			throw new Error("Missing context messages");
		}

		const result = streamText({
			model,
			system: systemTemplate,
			messages: [...context.messages, { role: "user", content: prompt }],
			temperature: 0.1,
			tools,
			stopWhen: stepCountIs(5), // Stop at step 5 if tools were called
			onError({ error }) {
				console.log(error); // your error logging logic here
			},
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
