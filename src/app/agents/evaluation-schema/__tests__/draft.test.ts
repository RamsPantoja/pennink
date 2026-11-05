import { describe, expect, it } from "vitest";
import { evaluationSchemaDefinitionSchema } from "~/server/api/schemas/evaluation-schema";
import { buildEvaluationSchemaDraft, runEvaluationSchemaDraft } from "../draft";
import type {
	EvaluationSchemaDraftInput,
	EvaluationSchemaDraftOutput,
} from "../schema";

const input: EvaluationSchemaDraftInput = {
	name: "Geography quiz",
	description: "Capitals",
	exam_text: "1. Capital of France? Paris",
};

const output: EvaluationSchemaDraftOutput = {
	name: "Geography quiz",
	description: "Checks capitals",
	questions: [
		{ statement: "The student names Paris as the capital of France." },
		{
			statement: "The student names Rome as the capital of Spain.",
			whenTrue: "Correct",
			whenFalse: "Wrong city",
		},
	],
};

describe("buildEvaluationSchemaDraft", () => {
	it("assigns keys in order and returns a schema that passes the server rules", () => {
		const result = buildEvaluationSchemaDraft(output, input);
		expect(result.status).toBe("draft");
		if (result.status !== "draft") return;

		expect(result.definition.questions.map((q) => q.key)).toEqual([
			"q_1",
			"q_2",
		]);
		expect(result.definition.questions.every((q) => q.type === "noul")).toBe(
			true,
		);
		expect(
			evaluationSchemaDefinitionSchema.safeParse(result.definition).success,
		).toBe(true);
	});

	it("keeps the teacher's name and description, and carries the criteria", () => {
		const result = buildEvaluationSchemaDraft(output, input);
		if (result.status !== "draft") throw new Error("expected draft");
		expect(result.name).toBe("Geography quiz");
		expect(result.description).toBe("Capitals");
		expect(result.definition.questions[1]?.criteria).toEqual({
			true: "Correct",
			false: "Wrong city",
		});
		expect(result.definition.questions[0]).not.toHaveProperty("criteria");
	});

	it("uses the default statement for an empty one", () => {
		const result = buildEvaluationSchemaDraft(
			{ ...output, questions: [{ statement: "   " }] },
			input,
		);
		if (result.status !== "draft") throw new Error("expected draft");
		expect(result.definition.questions[0]?.instructions).toBe(
			"The answer of the question 1 is correct?",
		);
	});

	it("rejects more than 50 questions with a message the model can act on", () => {
		const questions = Array.from({ length: 51 }, (_, i) => ({
			statement: `Statement ${i + 1}.`,
		}));
		const result = buildEvaluationSchemaDraft({ ...output, questions }, input);
		expect(result.status).toBe("error");
		if (result.status !== "error") return;
		expect(result.message).toMatch(/Fix the statements/);
	});

	it("rejects an empty question list", () => {
		const result = buildEvaluationSchemaDraft(
			{ ...output, questions: [] },
			input,
		);
		expect(result.status).toBe("error");
	});
});

describe("runEvaluationSchemaDraft", () => {
	it("returns the draft from the generator", async () => {
		const result = await runEvaluationSchemaDraft(input, async () => output);
		expect(result.status).toBe("draft");
	});

	it("turns a generator failure into an error result instead of throwing", async () => {
		const result = await runEvaluationSchemaDraft(input, async () => {
			throw new Error("model unavailable");
		});
		expect(result).toEqual({ status: "error", message: "model unavailable" });
	});
});
