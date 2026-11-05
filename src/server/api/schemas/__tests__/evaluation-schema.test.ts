import { describe, expect, it } from "vitest";
import {
	compileEvaluationSchema,
	evaluationSchemaDefinitionSchema,
	normalizeLegacyDefinition,
} from "../evaluation-schema";

const validDefinition = {
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

describe("evaluationSchemaDefinitionSchema", () => {
	it("accepts yes/no questions with and without criteria", () => {
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
				{ type: "noul", key: "q1", instructions: "First" },
				{ type: "noul", key: "q1", instructions: "Second" },
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
				questions: [{ type: "noul", key, instructions: "x" }],
			});
			expect(result.success, key).toBe(false);
		}
	});

	it("rejects choice, score and box questions", () => {
		for (const type of ["choice", "score", "box"]) {
			const result = evaluationSchemaDefinitionSchema.safeParse({
				questions: [
					{ type, key: "q1", instructions: "x", criteria: ["a", "b"] },
				],
			});
			expect(result.success, type).toBe(false);
		}
	});

	it("rejects an empty statement", () => {
		const result = evaluationSchemaDefinitionSchema.safeParse({
			questions: [{ type: "noul", key: "q1", instructions: "   " }],
		});
		expect(result.success).toBe(false);
	});
});

describe("normalizeLegacyDefinition", () => {
	it("converts choice, score and box questions to yes/no and reports their keys", () => {
		const legacy = {
			questions: [
				{
					type: "choice",
					key: "capital",
					instructions: "Which city is the capital of France?",
					criteria: { paris: "Correct" },
				},
				{
					type: "score",
					key: "explanation",
					instructions: "Rate the explanation.",
					criteria: ["None", "Full"],
				},
				{ type: "box", key: "signature", instructions: "Find the signature." },
				validDefinition.questions[0],
			],
		};

		const { definition, convertedKeys } = normalizeLegacyDefinition(legacy);

		expect(convertedKeys).toEqual(["capital", "explanation", "signature"]);
		expect(definition).toEqual({
			questions: [
				{
					type: "noul",
					key: "capital",
					instructions: "Which city is the capital of France?",
				},
				{
					type: "noul",
					key: "explanation",
					instructions: "Rate the explanation.",
				},
				{ type: "noul", key: "signature", instructions: "Find the signature." },
				validDefinition.questions[0],
			],
		});
		expect(evaluationSchemaDefinitionSchema.safeParse(definition).success).toBe(
			true,
		);
	});

	it("leaves a yes/no-only definition unchanged and reports nothing", () => {
		const { definition, convertedKeys } =
			normalizeLegacyDefinition(validDefinition);
		expect(definition).toEqual(validDefinition);
		expect(convertedKeys).toEqual([]);
	});

	it("is idempotent", () => {
		const once = normalizeLegacyDefinition({
			questions: [{ type: "box", key: "b", instructions: "x" }],
		});
		const twice = normalizeLegacyDefinition(once.definition);
		expect(twice.definition).toEqual(once.definition);
		expect(twice.convertedKeys).toEqual([]);
	});

	it("passes values it does not recognize through untouched", () => {
		expect(normalizeLegacyDefinition(null).definition).toBeNull();
		expect(normalizeLegacyDefinition({ questions: "nope" }).definition).toEqual(
			{
				questions: "nope",
			},
		);
	});
});

describe("compileEvaluationSchema", () => {
	it("maps each question to a Jev question keyed by its key", () => {
		const parsed = evaluationSchemaDefinitionSchema.parse(validDefinition);
		const compiled = compileEvaluationSchema(parsed);

		expect(Object.keys(compiled.questions)).toEqual(["has_name", "has_date"]);
		expect(compiled.questions.has_name).toEqual({
			type: "noul",
			instructions: "The student's name is written on the page.",
			criteria: { true: "Name present", false: "Name missing" },
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
