import { tool } from "ai";
import { z } from "zod";
import {
	searchDocumentChunks,
	type DocumentSearchDb,
} from "~/server/api/services/document-search";

export const DOCUMENT_SEARCH_MAX_CALLS = 5;

const description = `Search the text of the source documents attached to this workspace. Returns the passages most relevant to the query. Passages already returned earlier in this message are not repeated.
Use it for questions about the uploaded documents. Read the passages you get, then answer if they cover the question. Search again with a different or narrower query only if the passages are off-topic or leave a needed part unanswered. Do not search again for information you already have.
If a result says no new passages were found, stop searching and answer with what you have, saying what the documents do not cover.`;

export const createDocumentSearchTool = ({
	db,
	fileIds,
	maxCalls = DOCUMENT_SEARCH_MAX_CALLS,
}: {
	db: DocumentSearchDb;
	fileIds: string[];
	maxCalls?: number;
}) => {
	// Chunk ids already returned during this message, so repeated searches only add new text.
	const seenChunkIds = new Set<string>();
	let calls = 0;

	return tool({
		description,
		inputSchema: z.object({
			query: z
				.string()
				.trim()
				.min(1)
				.max(500)
				.describe("What to look for in the documents, in a short phrase or question."),
		}),
		execute: async ({ query }) => {
			if (calls >= maxCalls) {
				return {
					status: "limit_reached" as const,
					message: `Search limit of ${maxCalls} reached. Answer with the passages already retrieved.`,
					passages: [],
				};
			}
			calls += 1;

			try {
				const chunks = await searchDocumentChunks({ db, query, fileIds });
				const newChunks = chunks.filter((chunk) => !seenChunkIds.has(chunk.id));
				for (const chunk of newChunks) seenChunkIds.add(chunk.id);

				if (newChunks.length === 0) {
					return {
						status: "no_new_passages" as const,
						message:
							"No new passages were found. Stop searching and answer with what you have.",
						passages: [],
					};
				}

				return {
					status: "ok" as const,
					passages: newChunks.map((chunk) => ({
						document: chunk.name,
						text: chunk.content,
						distance: chunk.distance,
					})),
				};
			} catch (error) {
				return {
					status: "error" as const,
					message: error instanceof Error ? error.message : String(error),
					passages: [],
				};
			}
		},
	});
};
