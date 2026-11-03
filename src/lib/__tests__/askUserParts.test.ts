import { describe, expect, it } from "vitest";
import {
	hasPendingAskUser,
	settleAskUser,
	withAskUserOutput,
} from "~/lib/askUserParts";
import type { Message } from "~/server/api/services/chat";

const askPart = (toolCallId: string, state: string) => ({
	type: "tool-askUser",
	toolCallId,
	state,
	input: { questions: [] },
	...(state === "output-available" ? { output: { answers: [] } } : {}),
});

const makeMessage = (parts: unknown[]) =>
	({ id: "m1", role: "assistant", content: "", parts }) as unknown as Message;

describe("askUser message parts", () => {
	it("detects a question still waiting for an answer", () => {
		expect(hasPendingAskUser(makeMessage([askPart("t1", "input-available")]))).toBe(true);
		expect(hasPendingAskUser(makeMessage([askPart("t1", "output-available")]))).toBe(false);
	});

	it("records the answer on the matching question only", () => {
		const message = makeMessage([
			askPart("t1", "input-available"),
			askPart("t2", "input-available"),
		]);

		const answered = withAskUserOutput(message, "t1", {
			answers: [{ id: "q1", selected: ["NEM"] }],
		});

		expect(answered.parts[0]).toMatchObject({
			state: "output-available",
			output: { answers: [{ id: "q1", selected: ["NEM"] }] },
		});
		expect(answered.parts[1]).toMatchObject({ state: "input-available" });
	});

	it("skips every open question and leaves answered ones alone", () => {
		const message = makeMessage([
			askPart("t1", "output-available"),
			askPart("t2", "input-available"),
		]);

		const settled = settleAskUser(message);

		expect(settled.parts[0]).toMatchObject({ output: { answers: [] } });
		expect(settled.parts[1]).toMatchObject({
			state: "output-available",
			output: { skipped: true },
		});
	});
});
