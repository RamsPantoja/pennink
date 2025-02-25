import type { z } from "zod";
import type { createNotebookInputSchema } from "../schemas/notebook";
import type { TRPCContext } from "../trpc";
import type { messages } from "~/server/db/schema";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { TRPCError } from "@trpc/server";
import { ChatPromptTemplate } from "@langchain/core/prompts";

export type Message = typeof messages.$inferSelect;

type AIChatServiceConstructor = {
	ctx: TRPCContext;
};

export class AIChatService {
	ctx: TRPCContext;
	llm: ChatMistralAI;

	constructor({ ctx }: AIChatServiceConstructor) {
		this.ctx = ctx;
		this.llm = new ChatMistralAI({
			model: "mistral-large-latest",
			temperature: 0,
		});
	}

	public async chat(userPrompt: string, userId: string) {
		const systemTemplate = `
		    The user is gonna start a conversation with you about anything.
				Respond to the user's message as a friendly assistant.

				Your response must be strictly in markdown format.
			`;

		const promptTemplate = ChatPromptTemplate.fromMessages([
			["system", systemTemplate],
			["user", "{text}"],
		]);

		try {
			const promptValue = await promptTemplate.invoke({
				text: userPrompt,
			});

			// const streamResponse = await this.llm.stream(promptValue);

			const generatorFunction = async function* () {
				for (let i = 0; i < 3; i++) {
					await new Promise((resolve) => setTimeout(resolve, 500));
					yield i;
				}
			};

			return generatorFunction();
		} catch (error) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Failed to create AI chat",
			});
		}
	}
}
