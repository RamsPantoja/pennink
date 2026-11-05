import { describe, expect, it } from "vitest";
import { evaluationSchemaDefinitionSchema } from "~/server/api/schemas/evaluation-schema";
import { buildJevRequest, examScore, mapJevAnswers, needsReview } from "../jev";

const definition = evaluationSchemaDefinitionSchema.parse({
	questions: [
		{ type: "noul", key: "has_name", instructions: "Is the name written?" },
		{
			type: "noul",
			key: "has_diagram",
			instructions: "Is a labelled diagram drawn?",
			criteria: { true: "Diagram present", false: "No diagram" },
		},
	],
});

function must<T>(value: T | undefined): T {
	if (!value) throw new Error("Expected a value");
	return value;
}

describe("buildJevRequest", () => {
	it("references every page from state and includes each as an asset", () => {
		const request = buildJevRequest({
			definition,
			model: "jev-latest",
			pages: [
				{ placeholder: "ph_a", mimeType: "image/png", base64: "AAAA" },
				{ placeholder: "ph_b", mimeType: "image/jpeg", base64: "BBBB" },
			],
		});

		expect(request.state).toEqual({
			pages: { page_1: "ph_a", page_2: "ph_b" },
		});
		expect(request.assets).toEqual({
			ph_a: { type: "image", format: "png", data_base64: "AAAA" },
			ph_b: { type: "image", format: "jpg", data_base64: "BBBB" },
		});
		expect(Object.keys(request.questions)).toEqual(["has_name", "has_diagram"]);
		for (const question of Object.values(request.questions)) {
			expect(question.type).toBe("noul");
		}
	});

	it("sends legacy snapshots to Jev as yes/no questions", () => {
		const request = buildJevRequest({
			definition: {
				questions: [
					{
						type: "choice",
						key: "diagram",
						instructions: "Which diagram?",
						criteria: { cell: "A cell" },
					},
					{ type: "box", key: "signature", instructions: "Find it." },
				],
			},
			model: "jev-latest",
			pages: [],
		});

		expect(request.questions).toEqual({
			diagram: { type: "noul", instructions: "Which diagram?" },
			signature: { type: "noul", instructions: "Find it." },
		});
	});
});

describe("mapJevAnswers", () => {
	it("scores every answer as a yes/no probability", () => {
		const { answers, score } = mapJevAnswers(definition, {
			has_name: { type: "noul", noul: 0.95 },
			has_diagram: { type: "noul", noul: 0.2 },
		});

		expect(answers.has_name?.score).toBe(95);
		expect(answers.has_name?.flagged).toBe(false);
		expect(answers.has_diagram?.score).toBe(20);
		// Average of 95 and 20.
		expect(score).toBe(58);
	});

	it("flags uncertain answers and clears the flag when the teacher overrides", () => {
		const { answers } = mapJevAnswers(definition, {
			has_name: { type: "noul", noul: 0.5 },
			has_diagram: { type: "noul", noul: 0.9 },
		});

		expect(needsReview(answers)).toBe(true);
		expect(answers.has_name?.flagged).toBe(true);
		expect(answers.has_diagram?.flagged).toBe(false);

		const reviewed = {
			...answers,
			has_name: { ...must(answers.has_name), override: 100 },
		};
		expect(needsReview(reviewed)).toBe(false);
		expect(examScore(reviewed)).toBe(95);
	});

	it("maps legacy snapshots the same way as yes/no definitions", () => {
		const { answers } = mapJevAnswers(
			{
				questions: [
					{ type: "box", key: "signature", instructions: "Find it." },
				],
			},
			{ signature: { type: "noul", noul: 1 } },
		);
		expect(answers.signature?.score).toBe(100);
	});

	it("rejects a response that misses a question", () => {
		expect(() =>
			mapJevAnswers(definition, { has_name: { type: "noul", noul: 1 } }),
		).toThrow(/no answer for "has_diagram"/);
	});

	it("rejects an answer that is not yes/no", () => {
		expect(() =>
			mapJevAnswers(definition, {
				has_name: { type: "choice", choice: "yes" },
				has_diagram: { type: "noul", noul: 1 },
			}),
		).toThrow(/expected noul/);
	});
});
