import { bedrock } from "@ai-sdk/amazon-bedrock";
import { embed } from "ai";
import { asc, getTableColumns, inArray, sql } from "drizzle-orm";
import type { db as appDb } from "~/server/db";
import { embeddingDocuments } from "~/server/db/schema";

export const DOCUMENT_SEARCH_DEFAULT_LIMIT = 5;

// Only `select` is needed, so both the app db and the tRPC context db fit.
export type DocumentSearchDb = Pick<typeof appDb, "select">;

export type DocumentSearchResult = typeof embeddingDocuments.$inferSelect & {
	distance: number;
};

/**
 * Vector search over the chunks of the given source files.
 * Lower distance means a closer match. Throws on embedding or query failure.
 */
export const searchDocumentChunks = async ({
	db,
	query,
	fileIds,
	limit = DOCUMENT_SEARCH_DEFAULT_LIMIT,
}: {
	db: DocumentSearchDb;
	query: string;
	fileIds: string[];
	limit?: number;
}): Promise<DocumentSearchResult[]> => {
	if (fileIds.length === 0) return [];

	const model = bedrock.embeddingModel("amazon.titan-embed-text-v2:0");

	const embedding = await embed({
		model,
		value: query,
	});

	const distance = sql<number>`${embeddingDocuments.embedding} <=> ${JSON.stringify(embedding.embedding)}::vector`;

	return db
		.select({
			...getTableColumns(embeddingDocuments),
			distance: distance.as("distance"),
		})
		.from(embeddingDocuments)
		.where(inArray(embeddingDocuments.fileId, fileIds))
		.orderBy(asc(distance))
		.limit(limit);
};
