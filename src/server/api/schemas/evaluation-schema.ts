import { z } from "zod";
import { pageInputSchema, searchSchema } from "./pagination";

/**
 * A teacher-defined evaluation schema. Every question is a yes/no statement (`noul`)
 * that maps to one Jev question. `key` becomes the Jev question name. Teachers never
 * see it: the builder generates it.
 */
export const EVALUATION_QUESTION_KEY_REGEX = /^[a-z][a-z0-9_]{0,63}$/;
export const MAX_EVALUATION_QUESTIONS = 50;

const keySchema = z
	.string()
	.regex(
		EVALUATION_QUESTION_KEY_REGEX,
		"Use lowercase letters, digits and underscores, starting with a letter",
	);

const instructionsSchema = z.string().trim().min(1).max(2000);
const levelSchema = z.string().trim().min(1).max(1000);

export const evaluationQuestionSchema = z.object({
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

export const evaluationSchemaDefinitionSchema = z
	.object({
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

export type JevQuestion = {
	type: "noul";
	instructions: string;
	criteria?: { true?: string; false?: string };
};

export type CompiledEvaluationSchema = {
	questions: Record<string, JevQuestion>;
};

const LEGACY_QUESTION_TYPES = new Set(["choice", "score", "box"]);

/**
 * Schemas saved before yes/no-only questions may contain choice, score or box
 * questions. Each one becomes a yes/no question with the same key and instructions and
 * no criteria, so the teacher rewrites the statement. Yes/no questions pass through
 * unchanged. Returns the keys that were converted so the builder can flag them.
 * Accepts any value and is idempotent.
 */
export function normalizeLegacyDefinition(raw: unknown): {
	definition: unknown;
	convertedKeys: string[];
} {
	const convertedKeys: string[] = [];
	if (!raw || typeof raw !== "object" || !("questions" in raw)) {
		return { definition: raw, convertedKeys };
	}
	const { questions } = raw as { questions: unknown };
	if (!Array.isArray(questions)) return { definition: raw, convertedKeys };

	const normalized = questions.map((question: unknown) => {
		if (!question || typeof question !== "object") return question;
		const { type, key, instructions } = question as Record<string, unknown>;
		if (typeof type !== "string" || !LEGACY_QUESTION_TYPES.has(type)) {
			return question;
		}
		if (typeof key === "string") convertedKeys.push(key);
		return { type: "noul", key, instructions };
	});

	return {
		definition: { ...(raw as object), questions: normalized },
		convertedKeys,
	};
}

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

	return { questions };
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
