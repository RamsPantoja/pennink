import type { Block } from "@blocknote/core";

type LegacyEditorContent = {
	blocks?: unknown;
};

export const normalizeBlockNoteContent = (
	content: unknown,
): Block[] | undefined => {
	const blocks = Array.isArray(content)
		? content
		: content && typeof content === "object"
			? (content as LegacyEditorContent).blocks
			: undefined;

	return Array.isArray(blocks) && blocks.length > 0
		? (blocks as Block[])
		: undefined;
};
