import { describe, expect, it } from "vitest";
import { askUserInputSchema } from "~/app/agents/chat/ask-user";

const question = {
	id: "q1",
	question: "Which framework?",
	multiSelect: false,
	options: ["NEM", "UbD"],
};

describe("askUserInputSchema", () => {
	it("accepts a choice question and an open question", () => {
		const result = askUserInputSchema.safeParse({
			questions: [question, { id: "q2", question: "Class name?", multiSelect: false }],
		});

		expect(result.success).toBe(true);
	});

	it("rejects a single option, since a choice needs at least two", () => {
		const result = askUserInputSchema.safeParse({
			questions: [{ ...question, options: ["NEM"] }],
		});

		expect(result.success).toBe(false);
	});

	it("rejects more than six options", () => {
		const result = askUserInputSchema.safeParse({
			questions: [
				{ ...question, options: ["a", "b", "c", "d", "e", "f", "g"] },
			],
		});

		expect(result.success).toBe(false);
	});

	it("rejects more than three questions or none", () => {
		const four = Array.from({ length: 4 }, (_, i) => ({
			...question,
			id: `q${i}`,
		}));

		expect(askUserInputSchema.safeParse({ questions: four }).success).toBe(false);
		expect(askUserInputSchema.safeParse({ questions: [] }).success).toBe(false);
	});
});
