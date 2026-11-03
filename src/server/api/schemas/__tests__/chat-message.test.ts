import { describe, expect, it } from "vitest";
import { messageSchema } from "~/server/api/schemas/chat";

const base = {
	id: "01a1a29d-eb22-798c-b929-3efa84ba022e",
	chatId: "01a1a29d-2e3b-72bc-8ad8-cf7fe74ace01",
	role: "assistant",
	userId: "01a1704a-6a2a-70a3-9643-0e6bc7dbb2a3",
	createdAt: new Date(),
	updatedAt: new Date(),
	quote: null,
	metadata: null,
};

describe("messageSchema", () => {
	it("accepts an assistant turn that ends with only a tool call", () => {
		const result = messageSchema.safeParse({
			...base,
			content: "",
			parts: [{ type: "tool-askUser", toolCallId: "t1", state: "input-available" }],
		});

		expect(result.success).toBe(true);
	});

	it("rejects an empty message with no text and no tool part", () => {
		const result = messageSchema.safeParse({ ...base, content: "", parts: [] });

		expect(result.success).toBe(false);
	});
});
