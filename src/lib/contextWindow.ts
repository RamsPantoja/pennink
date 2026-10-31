export const CHAT_CONTEXT_WINDOW = 400_000;

const WARN_PERCENT = 75;
const DANGER_PERCENT = 90;

export type ContextUsageLevel = "ok" | "warn" | "danger";

export type ContextUsage = {
	tokens: number;
	percent: number;
	level: ContextUsageLevel;
};

export const estimateTokens = (text: string) => Math.ceil(text.length / 4);

export const getContextTokens = (metadata: unknown): number | null => {
	if (
		!metadata ||
		typeof metadata !== "object" ||
		!("contextTokens" in metadata) ||
		typeof metadata.contextTokens !== "number"
	) {
		return null;
	}

	return metadata.contextTokens;
};

type ConversationMessage = { content: string; metadata: unknown };

// Starts from the last real count the server reported and estimates only the
// messages sent after it. Falls back to estimating the whole conversation.
export const getConversationTokens = (messages: ConversationMessage[]) => {
	let baseTokens = 0;
	let estimateFrom = 0;

	for (let index = messages.length - 1; index >= 0; index--) {
		const tokens = getContextTokens(messages[index]?.metadata);

		if (tokens !== null) {
			baseTokens = tokens;
			estimateFrom = index + 1;
			break;
		}
	}

	return messages
		.slice(estimateFrom)
		.reduce(
			(total, message) => total + estimateTokens(message.content),
			baseTokens,
		);
};

export const getContextUsage = (tokens: number): ContextUsage => {
	const percent = Math.min(
		100,
		Math.round((tokens / CHAT_CONTEXT_WINDOW) * 100),
	);

	const level: ContextUsageLevel =
		percent >= DANGER_PERCENT
			? "danger"
			: percent >= WARN_PERCENT
				? "warn"
				: "ok";

	return { tokens, percent, level };
};
