import { isPendingAskUserPart } from "~/lib/askUserParts";

export type AgentStatusState =
	| "thinking"
	| "searching"
	| "waitingForTeacher"
	| "error";

type AgentStatusInput = {
	status: "submitted" | "streaming" | "ready" | "error";
	isSearching: boolean;
	lastMessageParts: readonly unknown[] | undefined;
};

// A searchDocuments tool call that has not produced its result yet.
export const isSearchingDocumentsPart = (part: unknown): boolean =>
	typeof part === "object" &&
	part !== null &&
	(part as { type?: unknown }).type === "tool-searchDocuments" &&
	["input-streaming", "input-available"].includes(
		String((part as { state?: unknown }).state),
	);

// Picks the one state to show. Order matters: an error wins over everything else.
export const getAgentStatus = ({
	status,
	isSearching,
	lastMessageParts,
}: AgentStatusInput): AgentStatusState | null => {
	const parts = lastMessageParts ?? [];

	if (status === "error") return "error";
	if (isSearching || parts.some(isSearchingDocumentsPart)) return "searching";
	if (status === "ready" && parts.some(isPendingAskUserPart)) {
		return "waitingForTeacher";
	}
	if (status === "submitted" || (status === "streaming" && parts.length === 0)) {
		return "thinking";
	}

	return null;
};
