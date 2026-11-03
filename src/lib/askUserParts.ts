import type { AskUserOutput } from "~/app/agents/chat/ask-user";
import type { Message } from "~/server/api/services/chat";

type AskUserPart = {
	type: "tool-askUser";
	toolCallId: string;
	state: string;
	input?: unknown;
	output?: unknown;
};

const isAskUserPart = (part: unknown): part is AskUserPart =>
	typeof part === "object" &&
	part !== null &&
	(part as { type?: unknown }).type === "tool-askUser";

const isPending = (part: AskUserPart) => part.state === "input-available";

export const isPendingAskUserPart = (part: unknown): boolean =>
	isAskUserPart(part) && isPending(part);

export const hasPendingAskUser = (message: Message) =>
	message.parts.some(isPendingAskUserPart);

export const withAskUserOutput = (
	message: Message,
	toolCallId: string,
	output: AskUserOutput,
): Message => ({
	...message,
	parts: message.parts.map((part) =>
		isAskUserPart(part) && part.toolCallId === toolCallId
			? { ...part, state: "output-available", output }
			: part,
	) as Message["parts"],
});

// The teacher sent a new message without answering, so every open question is skipped.
export const settleAskUser = (message: Message): Message => ({
	...message,
	parts: message.parts.map((part) =>
		isAskUserPart(part) && isPending(part)
			? { ...part, state: "output-available", output: { skipped: true } }
			: part,
	) as Message["parts"],
});
