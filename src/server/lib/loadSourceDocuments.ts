import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import type { SourceDocumentType } from "~/lib/documentTypes";
import { SOURCE_DOCUMENT_TYPES } from "~/lib/documentTypes";

type SourceDocument = {
	pageContent: string;
	metadata: Record<string, unknown>;
};

/**
 * Parses a stored source file into text documents, using the loader that
 * matches its MIME type.
 */
export const loadSourceDocuments = async (
	blob: Blob,
	type: SourceDocumentType,
	filename: string,
): Promise<SourceDocument[]> => {
	const { kind } = SOURCE_DOCUMENT_TYPES[type];

	switch (kind) {
		case "pdf":
			return new PDFLoader(blob).load();
		case "docx":
			return new DocxLoader(blob, { type: "docx" }).load();
		case "text":
			return [
				{
					pageContent: await blob.text(),
					metadata: { source: filename },
				},
			];
	}
};
