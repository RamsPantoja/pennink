import { describe, expect, it } from "vitest";
import { getAgentStatus } from "~/components/Chat/agentStatus";

const pendingAsk = { type: "tool-askUser", toolCallId: "t1", state: "input-available" };
const textPart = { type: "text", text: "Hola" };

const base = {
	status: "ready" as const,
	isSearching: false,
	lastMessageParts: [textPart],
};

describe("getAgentStatus", () => {
	it("shows thinking right after sending, before any part arrives", () => {
		expect(getAgentStatus({ ...base, status: "submitted", lastMessageParts: [] })).toBe("thinking");
		expect(getAgentStatus({ ...base, status: "streaming", lastMessageParts: [] })).toBe("thinking");
	});

	it("stops showing thinking once streamed text starts", () => {
		expect(getAgentStatus({ ...base, status: "streaming" })).toBeNull();
	});

	it("shows searching while the document search or limit check runs", () => {
		expect(getAgentStatus({ ...base, isSearching: true })).toBe("searching");
	});

	it("shows waiting for the teacher only when a pending askUser is ready", () => {
		expect(getAgentStatus({ ...base, lastMessageParts: [pendingAsk] })).toBe("waitingForTeacher");
		expect(getAgentStatus({ ...base, status: "streaming", lastMessageParts: [pendingAsk] })).toBeNull();
	});

	it("shows an error, and an error beats searching", () => {
		expect(getAgentStatus({ ...base, status: "error" })).toBe("error");
		expect(getAgentStatus({ ...base, status: "error", isSearching: true })).toBe("error");
	});

	it("shows nothing when the turn is idle", () => {
		expect(getAgentStatus(base)).toBeNull();
		expect(getAgentStatus({ ...base, lastMessageParts: undefined })).toBeNull();
	});
});
