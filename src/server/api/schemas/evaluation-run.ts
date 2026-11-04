import { z } from "zod";
import { pageInputSchema, searchSchema } from "./pagination";

export const EVALUATION_SUBMISSION_STATUSES = [
	"pending",
	"running",
	"needs_review",
	"graded",
	"failed",
] as const;

export type EvaluationSubmissionStatus =
	(typeof EVALUATION_SUBMISSION_STATUSES)[number];

export type EvaluationAnswer = {
	type: "choice" | "score" | "noul" | "box";
	/** 0 to 100, or null when the question does not produce a score. */
	score: number | null;
	label?: string;
	probability?: number;
	box?: { top: number; bottom: number; left: number; right: number };
	confidence?: number | null;
	/** True when the AI result is uncertain and a teacher should check it. */
	flagged: boolean;
	/** Teacher score (0 to 100) that replaces the AI score. */
	override?: number;
};

export type EvaluationAnswers = Record<string, EvaluationAnswer>;

/** Maximum pages per submission, bounded by Jev's 32 MiB request limit. */
export const MAX_PAGES_PER_SUBMISSION = 40;
export const MAX_SUBMISSIONS_PER_RUN = 300;

const idSchema = z.string().uuid();
const pageKeySchema = z
	.string()
	.trim()
	.min(1)
	.max(512)
	.regex(/^evaluation\/[\w-]+\/[\w.-]+$/, "Invalid storage key");

export const listEvaluationRunsInputSchema = pageInputSchema.extend({
	search: searchSchema,
});

export const evaluationRunByIdInputSchema = z.object({ id: idSchema });

export const createEvaluationRunInputSchema = z.object({
	evaluationSchemaId: idSchema,
	name: z.string().trim().min(1).max(150),
});

export const createEvaluationSubmissionInputSchema = z.object({
	runId: idSchema,
	studentName: z.string().trim().min(1).max(150),
	pages: z
		.array(
			z.object({
				pageNo: z.number().int().min(1),
				storageKey: pageKeySchema,
				mimeType: z.enum(["image/png", "image/jpeg"]),
			}),
		)
		.min(1)
		.max(MAX_PAGES_PER_SUBMISSION),
});

export const gradeEvaluationSubmissionInputSchema = z.object({
	id: idSchema,
});

export const overrideEvaluationAnswerInputSchema = z.object({
	submissionId: idSchema,
	key: z.string().min(1).max(64),
	/** Null clears the teacher score and returns to the AI score. */
	score: z.number().min(0).max(100).nullable(),
});

export const exportEvaluationRunInputSchema = z.object({
	runId: idSchema,
});
