import { describe, expect, it } from "vitest";
import type { EvaluationSchemaDefinition } from "~/server/api/schemas/evaluation-schema";
import {
	createQuestion,
	defaultInstructions,
	duplicateQuestion,
	issuesForQuestion,
	moveItem,
	nextUniqueKey,
	renumber,
	toDraft,
	toRawDefinition,
	validateDefinitionValue,
	validateDraft,
} from "../definition-form";

const definition: EvaluationSchemaDefinition = {
	questions: [
		{
			type: "noul",
			key: "has_name",
			instructions: "The student's name is written on the page.",
			criteria: { true: "Name present", false: "Name missing" },
		},
		{
			type: "noul",
			key: "has_date",
			instructions: "The date is written on the page.",
		},
	],
};

/** Returns the question at `index` or fails the test with a clear message. */
function at<T>(items: T[], index: number): T {
	const item = items[index];
	if (item === undefined) throw new Error(`no item at ${index}`);
	return item;
}

describe("definition-form round trip", () => {
	it("converts a stored definition to rows and back without changes", () => {
		const draft = toDraft(definition);
		expect(validateDefinitionValue(toRawDefinition(draft))).toEqual({
			ok: true,
			definition,
		});
	});

	it("drops empty optional criteria instead of storing blank strings", () => {
		const draft = toDraft({
			questions: [{ type: "noul", key: "ok", instructions: "Statement" }],
		});
		expect(toRawDefinition(draft)).toEqual({
			questions: [{ type: "noul", key: "ok", instructions: "Statement" }],
		});
	});

	it("marks converted questions from the loaded key list", () => {
		const draft = toDraft(definition, ["has_date"]);
		expect(at(draft.questions, 0).converted).toBe(false);
		expect(at(draft.questions, 1).converted).toBe(true);
	});

	it("keeps a loaded statement that is the default for its position automatic", () => {
		const draft = toDraft({
			questions: [
				{ type: "noul", key: "q_1", instructions: defaultInstructions(1) },
			],
		});
		expect(at(draft.questions, 0).autoInstructions).toBe(true);
	});
});

describe("default statement and automatic keys", () => {
	it("produces the default statement with the question number", () => {
		expect(defaultInstructions(3)).toBe(
			"The answer of the question 3 is correct?",
		);
	});

	it("starts a new question with an automatic key and the default statement", () => {
		const question = createQuestion([]);
		expect(question.key).toBe("q_1");
		expect(question.autoInstructions).toBe(true);
		expect(question.converted).toBe(false);
	});

	it("renumbers automatic statements after a reorder", () => {
		const first = renumber([createQuestion([]), createQuestion(["q_1"])]);
		expect(at(first, 0).instructions).toBe(defaultInstructions(1));
		expect(at(first, 1).instructions).toBe(defaultInstructions(2));

		const reordered = renumber(moveItem(first, 0, 1));
		expect(at(reordered, 0).instructions).toBe(defaultInstructions(1));
		expect(at(reordered, 1).instructions).toBe(defaultInstructions(2));
	});

	it("keeps keys stable across reorder and removal", () => {
		const questions = renumber([createQuestion([]), createQuestion(["q_1"])]);
		const keysBefore = questions.map((q) => q.key);

		const reordered = renumber(moveItem(questions, 0, 1));
		expect(reordered.map((q) => q.key)).toEqual([...keysBefore].reverse());

		const afterRemove = renumber(reordered.slice(1));
		expect(afterRemove.map((q) => q.key)).toEqual([keysBefore[0]]);
	});

	it("does not renumber a statement the teacher edited", () => {
		const questions = renumber([createQuestion([]), createQuestion(["q_1"])]);
		const edited = [
			{
				...at(questions, 0),
				instructions: "Custom text",
				autoInstructions: false,
			},
			at(questions, 1),
		];
		const renumbered = renumber(moveItem(edited, 0, 1));
		expect(at(renumbered, 1).instructions).toBe("Custom text");
		expect(at(renumbered, 0).instructions).toBe(defaultInstructions(1));
	});

	it("generates the first free question key", () => {
		expect(nextUniqueKey([])).toBe("q_1");
		expect(nextUniqueKey(["q_1", "q_2"])).toBe("q_3");
		expect(nextUniqueKey(["q_2"])).toBe("q_1");
	});

	it("duplicates a question with a new key and id", () => {
		const original = createQuestion([]);
		const copy = duplicateQuestion(original, ["q_1"]);
		expect(copy.key).toBe("q_2");
		expect(copy.id).not.toBe(original.id);
		expect(copy.converted).toBe(false);
	});
});

describe("validateDraft", () => {
	it("accepts a valid draft", () => {
		expect(validateDraft(toDraft(definition)).ok).toBe(true);
	});

	it("rejects a question with an empty statement", () => {
		const draft = toDraft(definition);
		draft.questions[0] = {
			...at(draft.questions, 0),
			instructions: "   ",
			autoInstructions: false,
		};

		const result = validateDraft(draft);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(issuesForQuestion(result.issues, 0).length).toBeGreaterThan(0);
	});

	it("flags duplicate question keys on the second question", () => {
		const draft = toDraft(definition);
		draft.questions[1] = { ...at(draft.questions, 1), key: "has_name" };

		const result = validateDraft(draft);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(issuesForQuestion(result.issues, 1)).toContainEqual(
			expect.objectContaining({ path: "questions.1.key" }),
		);
	});

	it("requires at least one question", () => {
		const result = validateDraft({ questions: [] });
		expect(result.ok).toBe(false);
	});
});
