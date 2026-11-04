import { describe, expect, it } from "vitest";
import { evaluationSchemaDefinitionSchema } from "~/server/api/schemas/evaluation-schema";
import { buildJevRequest, examScore, mapJevAnswers, needsReview } from "../jev";

const definition = evaluationSchemaDefinitionSchema.parse({
	instructions: "Secondary-level biology exam.",
	questions: [
		{ type: "noul", key: "has_name", instructions: "Is the name written?" },
		{
			type: "score",
			key: "explanation",
			instructions: "How complete is the explanation?",
			criteria: ["none", "partial", "complete"],
		},
		{
			type: "choice",
			key: "diagram",
			instructions: "Which diagram is drawn?",
			criteria: { cell: "A cell", plant: "A plant" },
		},
		{ type: "box", key: "signature", instructions: "Find the signature." },
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
			instructions: "Secondary-level biology exam.",
			pages: { page_1: "ph_a", page_2: "ph_b" },
		});
		expect(request.assets).toEqual({
			ph_a: { type: "image", format: "png", data_base64: "AAAA" },
			ph_b: { type: "image", format: "jpg", data_base64: "BBBB" },
		});
		expect(Object.keys(request.questions)).toEqual([
			"has_name",
			"explanation",
			"diagram",
			"signature",
		]);
	});
});

describe("mapJevAnswers", () => {
	it("scores noul and score answers and leaves choice and box unscored", () => {
		const { answers, score } = mapJevAnswers(definition, {
			has_name: { type: "noul", noul: 0.95 },
			explanation: {
				type: "score",
				score: 1,
				confidence: 0.9,
				legend: {},
				probabilities: {},
			},
			diagram: {
				type: "choice",
				choice: "cell",
				confidence: 0.8,
				probabilities: {},
			},
			signature: {
				type: "box",
				box: { top: 0.1, bottom: 0.2, left: 0.3, right: 0.4 },
				confidence: null,
			},
		});

		expect(answers.has_name?.score).toBe(95);
		expect(answers.explanation?.score).toBe(50);
		expect(answers.diagram?.score).toBeNull();
		expect(answers.diagram?.label).toBe("cell");
		expect(answers.signature?.box?.top).toBe(0.1);
		// Average of 95 and 50.
		expect(score).toBe(73);
	});

	it("flags uncertain answers and clears the flag when the teacher overrides", () => {
		const { answers } = mapJevAnswers(definition, {
			has_name: { type: "noul", noul: 0.5 },
			explanation: {
				type: "score",
				score: 2,
				confidence: 0.4,
				legend: {},
				probabilities: {},
			},
			diagram: {
				type: "choice",
				choice: "plant",
				confidence: 0.9,
				probabilities: {},
			},
			signature: {
				type: "box",
				box: { top: 0, bottom: 0, left: 0, right: 0 },
				confidence: null,
			},
		});

		expect(needsReview(answers)).toBe(true);
		expect(answers.has_name?.flagged).toBe(true);
		expect(answers.explanation?.flagged).toBe(true);
		expect(answers.diagram?.flagged).toBe(false);

		const reviewed = {
			...answers,
			has_name: { ...must(answers.has_name), override: 100 },
			explanation: { ...must(answers.explanation), override: 100 },
		};
		expect(needsReview(reviewed)).toBe(false);
		expect(examScore(reviewed)).toBe(100);
	});

	it("rejects a response that misses a question", () => {
		expect(() =>
			mapJevAnswers(definition, { has_name: { type: "noul", noul: 1 } }),
		).toThrow(/no answer for "explanation"/);
	});

	it("rejects an answer whose type does not match the question", () => {
		expect(() =>
			mapJevAnswers(definition, {
				has_name: { type: "choice", choice: "yes" },
				explanation: { type: "score", score: 0 },
				diagram: { type: "choice", choice: "cell" },
				signature: {
					type: "box",
					box: { top: 0, bottom: 0, left: 0, right: 0 },
				},
			}),
		).toThrow(/expected noul/);
	});
});
