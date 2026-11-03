import { tool } from "ai";
import { z } from "zod";

export const ASK_USER_MAX_QUESTIONS = 3;
export const ASK_USER_MAX_OPTIONS = 6;

export const askUserInputSchema = z.object({
	questions: z
		.array(
			z.object({
				id: z
					.string()
					.min(1)
					.max(40)
					.describe("Short key for this question, such as q1. Unique within the call."),
				question: z.string().trim().min(1).describe("The question shown to the teacher."),
				multiSelect: z
					.boolean()
					.describe(
						"False for a single choice (radio buttons). True when several options can apply (checkboxes).",
					),
				options: z
					.array(z.string().trim().min(1).max(120))
					.min(2)
					.max(ASK_USER_MAX_OPTIONS)
					.optional()
					.describe(
						"The choices. Omit for an open question, which shows a text box only.",
					),
			}),
		)
		.min(1)
		.max(ASK_USER_MAX_QUESTIONS),
});

export type AskUserInput = z.infer<typeof askUserInputSchema>;
export type AskUserQuestion = AskUserInput["questions"][number];

export type AskUserAnswer = {
	id: string;
	selected: string[];
	other?: string;
};

export type AskUserOutput = { answers: AskUserAnswer[] } | { skipped: true };

// No execute: the stream stops after this call and the chat renders the questions.
// The teacher's answers come back as the tool result, and the agent continues from them.
export const askUserTool = tool({
	description: `Ask the teacher to choose or answer up to ${ASK_USER_MAX_QUESTIONS} questions in the chat, shown as radio buttons, checkboxes or a text box. Use it only when the answer would materially change the result. For a known set of choices, pass 2 to ${ASK_USER_MAX_OPTIONS} options per question and set multiSelect. Omit options for an open question. Call it at most once per turn, and do not repeat the same questions in your visible text. You receive the answers as the tool result: continue from them without asking again. If the result says skipped, the teacher chose to continue without answering: make a reasonable assumption and state it in one line.`,
	inputSchema: askUserInputSchema,
});
