import JSZip from "jszip";

/** Largest zip the browser will unpack. */
export const EXAM_ZIP_MAX_BYTES = 200 * 1024 * 1024;
/** Most page images one zip may hold, across all students. */
export const EXAM_ZIP_MAX_IMAGES = 2000;

const IMAGE_MIME_BY_EXTENSION: Record<string, "image/png" | "image/jpeg"> = {
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
};

export type ZipPage = {
	/** Path inside the zip, such as `exam-03/juan-perez/page-01.png`. */
	path: string;
	file: File;
};

export type UnpackedZip = {
	pages: ZipPage[];
	/** Entries that were not page images, such as PDFs or notes. */
	skipped: number;
};

/** Hidden files and macOS metadata folders are not exam pages. */
const isIgnoredPath = (path: string) =>
	path
		.split("/")
		.some((segment) => segment === "__MACOSX" || segment.startsWith("."));

/**
 * Unpacks an exam zip in the browser. Only PNG and JPEG entries are kept.
 * Throws when the zip is too large or holds too many images.
 */
export async function unpackExamZip(zipFile: Blob): Promise<UnpackedZip> {
	if (zipFile.size > EXAM_ZIP_MAX_BYTES) {
		throw new Error(
			"This zip is larger than 200 MB. Split it into smaller zips.",
		);
	}

	const zip = await JSZip.loadAsync(await zipFile.arrayBuffer());
	const pages: ZipPage[] = [];
	let skipped = 0;

	const entries = Object.values(zip.files).filter(
		(entry) => !entry.dir && !isIgnoredPath(entry.name),
	);
	for (const entry of entries) {
		const extension = entry.name.split(".").pop()?.toLowerCase() ?? "";
		const mimeType = IMAGE_MIME_BY_EXTENSION[extension];
		if (!mimeType) {
			skipped++;
			continue;
		}

		if (pages.length >= EXAM_ZIP_MAX_IMAGES) {
			throw new Error(
				`This zip has more than ${EXAM_ZIP_MAX_IMAGES} page images. Split it into smaller zips.`,
			);
		}

		const bytes = await entry.async("uint8array");
		const name = entry.name.split("/").pop() ?? entry.name;
		pages.push({
			path: entry.name,
			file: new File([bytes], name, { type: mimeType }),
		});
	}

	return { pages, skipped };
}
