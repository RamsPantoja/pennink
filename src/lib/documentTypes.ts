export const SOURCE_DOCUMENT_TYPES = {
	"application/pdf": { kind: "pdf", extensions: [".pdf"] },
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
		kind: "docx",
		extensions: [".docx"],
	},
	"text/plain": { kind: "text", extensions: [".txt"] },
	"text/markdown": { kind: "text", extensions: [".md"] },
} as const;

export type SourceDocumentType = keyof typeof SOURCE_DOCUMENT_TYPES;
export type SourceDocumentKind =
	(typeof SOURCE_DOCUMENT_TYPES)[SourceDocumentType]["kind"];

export const SOURCE_ACCEPT = Object.values(SOURCE_DOCUMENT_TYPES)
	.flatMap((entry) => entry.extensions)
	.join(",");

export const isSourceDocumentType = (
	type: string,
): type is SourceDocumentType => type in SOURCE_DOCUMENT_TYPES;

/**
 * Returns the canonical MIME type for a file, or null when it is not a
 * supported source. Browsers often report an empty MIME type for `.md`, so
 * the extension is used as a fallback.
 */
export const getSourceDocumentType = (file: {
	name: string;
	type: string;
}): SourceDocumentType | null => {
	if (isSourceDocumentType(file.type)) return file.type;

	const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
	const match = (
		Object.entries(SOURCE_DOCUMENT_TYPES) as [
			SourceDocumentType,
			{ extensions: readonly string[] },
		][]
	).find(([, entry]) => entry.extensions.includes(extension));

	return match?.[0] ?? null;
};
