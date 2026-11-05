import { z } from "zod";
import { MAX_EVALUATION_QUESTIONS } from "~/server/api/schemas/evaluation-schema";

/** Tool input from the chat model. `exam_text` is the exam transcribed with its correct answers. */
export const evaluationSchemaDraftInputSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1)
		.max(150)
		.describe("Name for the schema, usually the exam title"),
	description: z
		.string()
		.trim()
		.max(1000)
		.optional()
		.describe("Short description of what the schema checks"),
	exam_text: z
		.string()
		.trim()
		.min(1)
		.max(60000)
		.describe(
			"The whole exam transcribed in order: each question with its correct answer. Include every question.",
		),
});

export type EvaluationSchemaDraftInput = z.infer<
	typeof evaluationSchemaDraftInputSchema
>;

/** Structured output the subagent must return: one yes/no statement per exam question. */
export const yesNoStatementSchema = z.object({
	statement: z
		.string()
		.describe(
			"A yes/no statement that states the correct answer, e.g. 'The student names Paris as the capital of France.'",
		),
	whenTrue: z
		.string()
		.optional()
		.describe("What it means when the statement is true (optional)"),
	whenFalse: z
		.string()
		.optional()
		.describe("What it means when the statement is false (optional)"),
});

export const evaluationSchemaDraftOutputSchema = z.object({
	name: z.string().describe("Name for the schema"),
	description: z.string().describe("Short description of the schema"),
	questions: z
		.array(yesNoStatementSchema)
		.min(1)
		.max(MAX_EVALUATION_QUESTIONS)
		.describe("One yes/no statement per exam question, in exam order"),
});

export type EvaluationSchemaDraftOutput = z.infer<
	typeof evaluationSchemaDraftOutputSchema
>;
