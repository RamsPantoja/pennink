import { JEV_IMAGE_MAX_SIDE, JEV_IMAGE_MIN_SIDE } from "~/lib/evaluation/jev";

export type PreparedImage = {
	blob: Blob;
	mimeType: "image/png" | "image/jpeg";
	extension: "png" | "jpg";
};

/**
 * Re-encodes a page for Jev. The orientation is applied, EXIF is dropped by the re-encode,
 * and the longest side is capped at Jev's limit. Pages Jev would reject are refused here.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
	const bitmap = await createImageBitmap(file, {
		imageOrientation: "from-image",
	});
	const scale = Math.min(
		1,
		JEV_IMAGE_MAX_SIDE / Math.max(bitmap.width, bitmap.height),
	);
	const width = Math.round(bitmap.width * scale);
	const height = Math.round(bitmap.height * scale);

	if (Math.min(width, height) < JEV_IMAGE_MIN_SIDE) {
		bitmap.close();
		throw new Error(
			`${file.name} is too small. Each side must be at least ${JEV_IMAGE_MIN_SIDE}px.`,
		);
	}

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const context = canvas.getContext("2d");
	if (!context) throw new Error("Could not prepare the image");
	context.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();

	const isPng = file.type === "image/png";
	const mimeType = isPng ? "image/png" : "image/jpeg";
	const blob = await new Promise<Blob>((resolve, reject) =>
		canvas.toBlob(
			(result) =>
				result
					? resolve(result)
					: reject(new Error("Could not encode the image")),
			mimeType,
			0.92,
		),
	);

	return { blob, mimeType, extension: isPng ? "png" : "jpg" };
}
