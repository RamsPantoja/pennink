import { describe, expect, it } from "vitest";
import {
	compileEvaluationSchema,
	evaluationSchemaDefinitionSchema,
} from "../evaluation-schema";

const validDefinition = {
	instructions: "Grade handwritten answers in Spanish.",
	questions: [
		{
			type: "choice",
			key: "capital",
			instructions: "Which city is the capital of France?",
			criteria: { paris: "Paris is correct", lyon: "Lyon is incorrect" },
		},
		{
			type: "score",
			key: "explanation",
			instructions: "Rate the explanation of photosynthesis.",
			criteria: ["No explanation", "Partial", "Complete"],
		},
		{
			type: "noul",
			key: "has_name",
			instructions: "Is the student's name written on the page?",
			criteria: { true: "Name present", false: "Name missing" },
		},
		{
			type: "box",
			key: "signature",
			instructions: "Locate the teacher's signature.",
		},
	],
};

describe("evaluationSchemaDefinitionSchema", () => {
	it("accepts a definition with every Jev question type", () => {
		expect(
			evaluationSchemaDefinitionSchema.safeParse(validDefinition).success,
		).toBe(true);
	});

	it("rejects an empty question list", () => {
		const result = evaluationSchemaDefinitionSchema.safeParse({
			questions: [],
		});
		expect(result.success).toBe(false);
	});

	it("rejects duplicate question keys and points at the second one", () => {
		const result = evaluationSchemaDefinitionSchema.safeParse({
			questions: [
				{ type: "box", key: "q1", instructions: "First" },
				{ type: "box", key: "q1", instructions: "Second" },
			],
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.path).toEqual(["questions", 1, "key"]);
		}
	});

	it("rejects keys that are not safe Jev question names", () => {
		for (const key of ["Q1", "1st", "has space", "a-b", ""]) {
			const result = evaluationSchemaDefinitionSchema.safeParse({
				questions: [{ type: "box", key, instructions: "x" }],
			});
			expect(result.success, key).toBe(false);
		}
	});

	it("requires at least two levels for a score question", () => {
		const result = evaluationSchemaDefinitionSchema.safeParse({
			questions: [
				{ type: "score", key: "s", instructions: "x", criteria: ["only one"] },
			],
		});
		expect(result.success).toBe(false);
	});

	it("caps score levels at ten", () => {
		const criteria = Array.from({ length: 11 }, (_, i) => `level ${i}`);
		const result = evaluationSchemaDefinitionSchema.safeParse({
			questions: [{ type: "score", key: "s", instructions: "x", criteria }],
		});
		expect(result.success).toBe(false);
	});

	it("rejects a choice question with no options", () => {
		const result = evaluationSchemaDefinitionSchema.safeParse({
			questions: [
				{ type: "choice", key: "c", instructions: "x", criteria: {} },
			],
		});
		expect(result.success).toBe(false);
	});

	it("rejects an unknown question type", () => {
		const result = evaluationSchemaDefinitionSchema.safeParse({
			questions: [{ type: "essay", key: "e", instructions: "x" }],
		});
		expect(result.success).toBe(false);
	});
});

describe("compileEvaluationSchema", () => {
	it("maps each question to a Jev question keyed by its key", () => {
		const parsed = evaluationSchemaDefinitionSchema.parse(validDefinition);
		const compiled = compileEvaluationSchema(parsed);

		expect(compiled.instructions).toBe("Grade handwritten answers in Spanish.");
		expect(Object.keys(compiled.questions)).toEqual([
			"capital",
			"explanation",
			"has_name",
			"signature",
		]);
		expect(compiled.questions.capital).toEqual({
			type: "choice",
			instructions: "Which city is the capital of France?",
			criteria: { paris: "Paris is correct", lyon: "Lyon is incorrect" },
		});
		expect(compiled.questions.signature).toEqual({
			type: "box",
			instructions: "Locate the teacher's signature.",
		});
	});

	it("does not leak the key into the Jev question body", () => {
		const parsed = evaluationSchemaDefinitionSchema.parse(validDefinition);
		const compiled = compileEvaluationSchema(parsed);
		for (const question of Object.values(compiled.questions)) {
			expect(question).not.toHaveProperty("key");
		}
	});
});
