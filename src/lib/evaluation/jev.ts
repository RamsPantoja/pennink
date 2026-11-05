import type {
	EvaluationAnswer,
	EvaluationAnswers,
} from "~/server/api/schemas/evaluation-run";
import {
	type EvaluationSchemaDefinition,
	type JevQuestion,
	compileEvaluationSchema,
	normalizeLegacyDefinition,
} from "~/server/api/schemas/evaluation-schema";

export const JEV_API_URL = "https://api.typesafe.ai/v1/systemone";
export const JEV_DANGER_ZONE_HEADER = "TypeSafe-Danger-Zone-Images";
/** Jev rejects requests over 32 MiB. Keep headroom for the JSON wrapper and base64 overhead. */
export const JEV_MAX_BODY_BYTES = 30 * 1024 * 1024;
/** Jev accepts images whose sides are between these pixel bounds. */
export const JEV_IMAGE_MIN_SIDE = 280;
export const JEV_IMAGE_MAX_SIDE = 1568;
/** Answers below this confidence are sent to the teacher for review. */
export const JEV_CONFIDENCE_THRESHOLD = 0.7;

export type JevPage = {
	/** Placeholder that appears in `state` and in `assets`. */
	placeholder: string;
	mimeType: "image/png" | "image/jpeg";
	base64: string;
};

export type JevSystemOneRequest = {
	model: string;
	state: Record<string, unknown>;
	assets: Record<
		string,
		{ type: "image"; format: "png" | "jpg"; data_base64: string }
	>;
	questions: Record<string, JevQuestion>;
};

/** Builds the Jev request. Every page is referenced from `state` so no asset is unused. */
export function buildJevRequest({
	definition,
	pages,
	model,
}: {
	definition: unknown;
	pages: JevPage[];
	model: string;
}): JevSystemOneRequest {
	const compiled = compileEvaluationSchema(asDefinition(definition));
	const assets: JevSystemOneRequest["assets"] = {};
	const pageRefs: Record<string, string> = {};

	pages.forEach((page, index) => {
		assets[page.placeholder] = {
			type: "image",
			format: page.mimeType === "image/png" ? "png" : "jpg",
			data_base64: page.base64,
		};
		pageRefs[`page_${index + 1}`] = page.placeholder;
	});

	return {
		model,
		state: {
			pages: pageRefs,
		},
		assets,
		questions: compiled.questions,
	};
}

/** Bytes that base64 adds to a request body, used to stay under Jev's limit. */
export function estimateJevBodyBytes(pages: { base64: string }[]) {
	return pages.reduce((total, page) => total + page.base64.length, 0);
}

type RawAnswer = {
	type: string;
	noul?: number;
	choice?: string;
	score?: number;
	confidence?: number | null;
	box?: { top: number; bottom: number; left: number; right: number };
};

const isNumber = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value);

const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value));

/** Stored snapshots may predate yes/no-only questions, so normalize before use. */
function asDefinition(definition: unknown): EvaluationSchemaDefinition {
	return normalizeLegacyDefinition(definition)
		.definition as EvaluationSchemaDefinition;
}

/**
 * Converts Jev answers into stored results. Every question is a yes/no statement.
 * Scoring rule (the teacher can override any score):
 * - noul: the probability of the "true" statement, as 0 to 100.
 * The exam score is the average of the scored questions.
 */
export function mapJevAnswers(
	definition: unknown,
	rawAnswers: unknown,
): { answers: EvaluationAnswers; score: number | null } {
	if (!rawAnswers || typeof rawAnswers !== "object") {
		throw new Error("Jev response has no answers");
	}
	const raw = rawAnswers as Record<string, RawAnswer | undefined>;
	const answers: EvaluationAnswers = {};

	for (const question of asDefinition(definition).questions) {
		const answer = raw[question.key];
		if (!answer) {
			throw new Error(`Jev returned no answer for "${question.key}"`);
		}
		answers[question.key] = toYesNoAnswer(question.key, answer);
	}

	return { answers, score: examScore(answers) };
}

function toYesNoAnswer(key: string, answer: RawAnswer): EvaluationAnswer {
	if (answer.type !== "noul") {
		throw new Error(`Jev answered "${key}" as ${answer.type}, expected noul`);
	}
	if (!isNumber(answer.noul)) throw new Error(`Missing noul for "${key}"`);

	const probability = clamp(answer.noul, 0, 1);
	return {
		type: "noul",
		score: Math.round(probability * 100),
		probability,
		confidence: null,
		// A probability near 0.5 means Jev is not sure either way.
		flagged: probability > 0.3 && probability < 0.7,
	};
}

/** Average of the scored answers, honoring teacher overrides. Null when nothing is scored. */
export function examScore(answers: EvaluationAnswers): number | null {
	const scores = Object.values(answers)
		.map((answer) => answer.override ?? answer.score)
		.filter((value): value is number => value !== null);
	if (scores.length === 0) return null;
	return Math.round(
		scores.reduce((sum, value) => sum + value, 0) / scores.length,
	);
}

/** A submission needs review while any flagged answer has no teacher override. */
export function needsReview(answers: EvaluationAnswers) {
	return Object.values(answers).some(
		(answer) => answer.flagged && answer.override === undefined,
	);
}
