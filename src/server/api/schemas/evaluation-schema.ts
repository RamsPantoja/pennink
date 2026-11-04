import { z } from "zod";
import { pageInputSchema, searchSchema } from "./pagination";

/**
 * A teacher-defined evaluation schema. Each question maps to one Jev question
 * (choice, score, noul or box). `key` becomes the Jev question name, so it must
 * be a stable identifier the teacher can read in results.
 */
export const EVALUATION_QUESTION_KEY_REGEX = /^[a-z][a-z0-9_]{0,63}$/;
export const MAX_EVALUATION_QUESTIONS = 50;
export const MAX_CHOICE_OPTIONS = 255;
export const MAX_SCORE_LEVELS = 10;

const keySchema = z
	.string()
	.regex(
		EVALUATION_QUESTION_KEY_REGEX,
		"Use lowercase letters, digits and underscores, starting with a letter",
	);

const instructionsSchema = z.string().trim().min(1).max(2000);
const levelSchema = z.string().trim().min(1).max(1000);

const choiceQuestionSchema = z.object({
	type: z.literal("choice"),
	key: keySchema,
	instructions: instructionsSchema,
	criteria: z
		.record(z.string().trim().min(1).max(200), levelSchema)
		.refine(
			(options) =>
				Object.keys(options).length >= 1 &&
				Object.keys(options).length <= MAX_CHOICE_OPTIONS,
			`Choice questions need between 1 and ${MAX_CHOICE_OPTIONS} options`,
		),
});

const scoreQuestionSchema = z.object({
	type: z.literal("score"),
	key: keySchema,
	instructions: instructionsSchema,
	// Ordered from the lowest level (0) to the highest (N-1).
	criteria: z.array(levelSchema).min(2).max(MAX_SCORE_LEVELS),
});

const noulQuestionSchema = z.object({
	type: z.literal("noul"),
	key: keySchema,
	instructions: instructionsSchema,
	criteria: z
		.object({
			true: levelSchema.optional(),
			false: levelSchema.optional(),
		})
		.optional(),
});

const boxQuestionSchema = z.object({
	type: z.literal("box"),
	key: keySchema,
	instructions: instructionsSchema,
});

export const evaluationQuestionSchema = z.discriminatedUnion("type", [
	choiceQuestionSchema,
	scoreQuestionSchema,
	noulQuestionSchema,
	boxQuestionSchema,
]);

export const evaluationSchemaDefinitionSchema = z
	.object({
		// Exam-level context sent with every evaluation, such as the subject or the expected layout.
		instructions: z.string().trim().max(4000).optional(),
		questions: z
			.array(evaluationQuestionSchema)
			.min(1)
			.max(MAX_EVALUATION_QUESTIONS),
	})
	.superRefine((definition, ctx) => {
		const seen = new Set<string>();
		definition.questions.forEach((question, index) => {
			if (seen.has(question.key)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Duplicate question key "${question.key}"`,
					path: ["questions", index, "key"],
				});
			}
			seen.add(question.key);
		});
	});

export type EvaluationQuestion = z.infer<typeof evaluationQuestionSchema>;
export type EvaluationSchemaDefinition = z.infer<
	typeof evaluationSchemaDefinitionSchema
>;

export type JevQuestion =
	| { type: "choice"; instructions: string; criteria: Record<string, string> }
	| { type: "score"; instructions: string; criteria: string[] }
	| {
			type: "noul";
			instructions: string;
			criteria?: { true?: string; false?: string };
	  }
	| { type: "box"; instructions: string };

export type CompiledEvaluationSchema = {
	instructions?: string;
	questions: Record<string, JevQuestion>;
};

/**
 * Maps a validated definition to the Jev question set, keyed by question key.
 * The exam-level instructions are returned separately so the caller can send them as state.
 */
export function compileEvaluationSchema(
	definition: EvaluationSchemaDefinition,
): CompiledEvaluationSchema {
	const questions: Record<string, JevQuestion> = {};

	for (const { key, ...question } of definition.questions) {
		questions[key] = question;
	}

	return { instructions: definition.instructions, questions };
}

const evaluationSchemaIdSchema = z.string().uuid();
const nameSchema = z.string().trim().min(1).max(150);
const descriptionSchema = z.string().trim().max(1000);

export const evaluationSchemaByIdInputSchema = z.object({
	id: evaluationSchemaIdSchema,
});

export const listEvaluationSchemasInputSchema = pageInputSchema.extend({
	search: searchSchema,
});

export const createEvaluationSchemaInputSchema = z.object({
	name: nameSchema,
	description: descriptionSchema.default(""),
	definition: evaluationSchemaDefinitionSchema,
});

export const updateEvaluationSchemaInputSchema = z.object({
	id: evaluationSchemaIdSchema,
	name: nameSchema.optional(),
	description: descriptionSchema.optional(),
	definition: evaluationSchemaDefinitionSchema.optional(),
});
