import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { EXAM_ZIP_MAX_BYTES, unpackExamZip } from "../zip";

async function buildZip(files: Record<string, string>) {
	const zip = new JSZip();
	for (const [path, content] of Object.entries(files)) {
		if (path.endsWith("/")) zip.folder(path.slice(0, -1));
		else zip.file(path, content);
	}
	return new Blob([await zip.generateAsync({ type: "uint8array" })]);
}

describe("unpackExamZip", () => {
	it("keeps only page images and reports other entries as skipped", async () => {
		const blob = await buildZip({
			"exam-03/juan-perez/page-01.png": "png-bytes",
			"exam-03/juan-perez/page-02.JPG": "jpg-bytes",
			"exam-03/juan-perez/notes.pdf": "pdf",
			"exam-03/juan-perez/": "",
		});

		const { pages, skipped } = await unpackExamZip(blob);

		expect(pages.map((page) => page.path)).toEqual([
			"exam-03/juan-perez/page-01.png",
			"exam-03/juan-perez/page-02.JPG",
		]);
		expect(pages[0]?.file.type).toBe("image/png");
		expect(pages[1]?.file.type).toBe("image/jpeg");
		expect(pages[0]?.file.name).toBe("page-01.png");
		expect(skipped).toBe(1);
	});

	it("ignores macOS metadata and hidden files", async () => {
		const blob = await buildZip({
			"juan/page-01.png": "a",
			"__MACOSX/juan/._page-01.png": "b",
			"juan/.DS_Store": "c",
		});

		const { pages } = await unpackExamZip(blob);
		expect(pages.map((page) => page.path)).toEqual(["juan/page-01.png"]);
	});

	it("rejects a zip over the size limit", async () => {
		const oversized = new Blob([new Uint8Array(0)]);
		Object.defineProperty(oversized, "size", { value: EXAM_ZIP_MAX_BYTES + 1 });
		await expect(unpackExamZip(oversized)).rejects.toThrow(/200 MB/);
	});
});
