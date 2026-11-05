import {
	type EvaluationSchemaDefinition,
	MAX_EVALUATION_QUESTIONS,
	evaluationSchemaDefinitionSchema,
} from "~/server/api/schemas/evaluation-schema";

/**
 * Editable shape used by the form builder. Every question is a yes/no statement.
 * `key` is generated and hidden from the teacher. When `autoInstructions` is true the
 * text follows the question's position (see `renumber`) until the teacher edits it.
 * `converted` marks a question that was a choice, score or box question before.
 */
export type DraftQuestion = {
	id: string;
	key: string;
	instructions: string;
	whenTrue: string;
	whenFalse: string;
	autoInstructions: boolean;
	converted: boolean;
};

export type DraftDefinition = {
	questions: DraftQuestion[];
};

export type Issue = { path: string; message: string };

export type DraftValidation =
	| { ok: true; definition: EvaluationSchemaDefinition }
	| { ok: false; issues: Issue[] };

let idSequence = 0;
/** Stable React key for rows; never persisted. */
export function nextId(): string {
	idSequence += 1;
	return `row-${idSequence}`;
}

/** Default statement for the question at `position` (1-based). */
export function defaultInstructions(position: number): string {
	return `The answer of the question ${position} is correct?`;
}

/** Returns the first `q_N` key not already used. */
export function nextUniqueKey(usedKeys: string[]): string {
	const used = new Set(usedKeys);
	let n = 1;
	while (used.has(`q_${n}`)) n += 1;
	return `q_${n}`;
}

/** New yes/no question with an automatic key and the default statement. */
export function createQuestion(usedKeys: string[]): DraftQuestion {
	return {
		id: nextId(),
		key: nextUniqueKey(usedKeys),
		instructions: "",
		whenTrue: "",
		whenFalse: "",
		autoInstructions: true,
		converted: false,
	};
}

/** Sets the default statement on every question that still follows its position. */
export function renumber(questions: DraftQuestion[]): DraftQuestion[] {
	return questions.map((question, index) =>
		question.autoInstructions
			? { ...question, instructions: defaultInstructions(index + 1) }
			: question,
	);
}

export function moveItem<T>(items: T[], from: number, to: number): T[] {
	if (to < 0 || to >= items.length || from === to) return items;
	const next = [...items];
	const [moved] = next.splice(from, 1);
	next.splice(to, 0, moved as T);
	return next;
}

/** Copies a question with a new key and id. The copy's text is set by `renumber`. */
export function duplicateQuestion(
	question: DraftQuestion,
	usedKeys: string[],
): DraftQuestion {
	return {
		...question,
		id: nextId(),
		key: nextUniqueKey(usedKeys),
		converted: false,
	};
}

/**
 * Converts a stored definition into editable rows. Text is kept as written. A question
 * whose text is still the default for its position keeps following its position.
 */
export function toDraft(
	definition: EvaluationSchemaDefinition,
	convertedKeys: string[] = [],
): DraftDefinition {
	return {
		questions: definition.questions.map((question, index) => ({
			id: nextId(),
			key: question.key,
			instructions: question.instructions,
			whenTrue: question.criteria?.true ?? "",
			whenFalse: question.criteria?.false ?? "",
			autoInstructions:
				question.instructions === defaultInstructions(index + 1),
			converted: convertedKeys.includes(question.key),
		})),
	};
}

/**
 * Converts editable rows into the raw stored shape. Values are trimmed and empty
 * optional fields are dropped. The result is not validated yet.
 */
export function toRawDefinition(draft: DraftDefinition): unknown {
	return {
		questions: draft.questions.map((question) => {
			const base = {
				type: "noul" as const,
				key: question.key.trim(),
				instructions: question.instructions.trim(),
			};
			const criteria: { true?: string; false?: string } = {};
			if (question.whenTrue.trim()) criteria.true = question.whenTrue.trim();
			if (question.whenFalse.trim()) criteria.false = question.whenFalse.trim();
			return Object.keys(criteria).length > 0 ? { ...base, criteria } : base;
		}),
	};
}

/** Validates any raw value against the same schema the server uses. */
export function validateDefinitionValue(raw: unknown): DraftValidation {
	const result = evaluationSchemaDefinitionSchema.safeParse(raw);
	if (!result.success) {
		return {
			ok: false,
			issues: result.error.issues.map((issue) => ({
				path: issue.path.join(".") || "(root)",
				message: issue.message,
			})),
		};
	}
	return { ok: true, definition: result.data };
}

/** Validates the editable rows against the server schema. */
export function validateDraft(draft: DraftDefinition): DraftValidation {
	if (draft.questions.length > MAX_EVALUATION_QUESTIONS) {
		return {
			ok: false,
			issues: [
				{
					path: "questions",
					message: `Use at most ${MAX_EVALUATION_QUESTIONS} questions`,
				},
			],
		};
	}
	return validateDefinitionValue(toRawDefinition(draft));
}

/** Issues that belong to one question, for inline display. Paths look like `questions.2.key`. */
export function issuesForQuestion(issues: Issue[], index: number): Issue[] {
	const prefix = `questions.${index}.`;
	return issues.filter((issue) => issue.path.startsWith(prefix));
}

/** Issues not tied to a question, such as the empty question list. */
export function issuesWithoutQuestion(issues: Issue[]): Issue[] {
	return issues.filter((issue) => !issue.path.startsWith("questions."));
}
