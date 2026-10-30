export const OBJECTIVE_QUESTION_TYPES = [
	"radio",
	"checkbox",
	"select",
	"switch",
	"slider",
	"number",
] as const;

export type QuestionStatus =
	| "correct"
	| "partial"
	| "incorrect"
	| "unanswered"
	| "pending";

export type QuestionResult = {
	key: string;
	status: QuestionStatus;
	score: number;
	feedback?: string;
};

export type GradableQuestion = {
	key: string;
	type: string;
	answer: unknown;
};

export const isBlank = (value: unknown) =>
	value === undefined ||
	value === null ||
	value === "" ||
	(Array.isArray(value) && value.length === 0);

const toList = (value: unknown): string[] =>
	(Array.isArray(value) ? value : [value])
		.filter((item) => !isBlank(item))
		.map(String);

const toNumber = (value: unknown) =>
	Number(Array.isArray(value) ? value[0] : value);

export const isObjectiveQuestion = (type: string) =>
	(OBJECTIVE_QUESTION_TYPES as readonly string[]).includes(type);

export const statusFromScore = (score: number): QuestionStatus => {
	if (score >= 100) return "correct";
	if (score > 0) return "partial";
	return "incorrect";
};

const result = (key: string, status: QuestionStatus, score: number) => ({
	key,
	status,
	score,
});

export function gradeObjectiveQuestion(
	question: GradableQuestion,
	userAnswer: unknown,
): QuestionResult {
	const { key, type, answer } = question;

	if (isBlank(userAnswer)) return result(key, "unanswered", 0);
	if (isBlank(answer)) return result(key, "incorrect", 0);

	switch (type) {
		case "checkbox": {
			const expected = toList(answer);
			const selected = toList(userAnswer);
			const hits = selected.filter((item) => expected.includes(item)).length;
			const misses = selected.length - hits;

			if (misses === 0 && hits === expected.length) {
				return result(key, "correct", 100);
			}
			// Partial credit only when every selection is right and at least half of the correct options were picked.
			if (misses === 0 && hits / expected.length >= 0.5) {
				return result(key, "partial", 50);
			}
			return result(key, "incorrect", 0);
		}
		case "radio":
		case "select":
			return String(userAnswer) === String(answer)
				? result(key, "correct", 100)
				: result(key, "incorrect", 0);
		case "switch":
			return Boolean(userAnswer) === Boolean(answer)
				? result(key, "correct", 100)
				: result(key, "incorrect", 0);
		case "number":
		case "slider": {
			const given = toNumber(userAnswer);
			const expected = toNumber(answer);
			return Number.isFinite(given) &&
				Number.isFinite(expected) &&
				given === expected
				? result(key, "correct", 100)
				: result(key, "incorrect", 0);
		}
		default:
			return result(key, "pending", 0);
	}
}

// Open-ended questions start as "pending" until the AI grades them.
export function gradeQuestion(
	question: GradableQuestion,
	userAnswer: unknown,
): QuestionResult {
	if (isObjectiveQuestion(question.type)) {
		return gradeObjectiveQuestion(question, userAnswer);
	}
	if (isBlank(userAnswer)) return result(question.key, "unanswered", 0);
	return result(question.key, "pending", 0);
}

// Every question counts equally; each one contributes 0-100.
export function calculateExamScore(results: QuestionResult[]) {
	if (results.length === 0) return 0;
	const total = results.reduce((sum, item) => sum + item.score, 0);
	return Math.round(total / results.length);
}
