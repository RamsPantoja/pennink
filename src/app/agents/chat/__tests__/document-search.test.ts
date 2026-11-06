import { beforeEach, describe, expect, it, vi } from "vitest";

const searchDocumentChunks = vi.fn();

vi.mock("~/server/api/services/document-search", () => ({
	searchDocumentChunks: (...args: unknown[]) => searchDocumentChunks(...args),
}));

import { createDocumentSearchTool } from "~/app/agents/chat/document-search";

type ToolResult = {
	status: string;
	passages: { document: string; text: string; distance: number }[];
};

const run = async (
	tool: ReturnType<typeof createDocumentSearchTool>,
	query: string,
): Promise<ToolResult> =>
	(await tool.execute?.({ query }, {} as never)) as ToolResult;

const chunk = (id: string, content = `text ${id}`) => ({
	id,
	name: "notes.pdf",
	content,
	distance: 0.2,
});

const fakeDb = {} as never;

describe("createDocumentSearchTool", () => {
	beforeEach(() => {
		searchDocumentChunks.mockReset();
	});

	it("returns passages from the workspace files", async () => {
		searchDocumentChunks.mockResolvedValue([chunk("c1"), chunk("c2")]);
		const tool = createDocumentSearchTool({ db: fakeDb, fileIds: ["f1"] });

		const result = await run(tool, "photosynthesis");

		expect(result.status).toBe("ok");
		expect(result.passages).toHaveLength(2);
		expect(result.passages[0]).toEqual({
			document: "notes.pdf",
			text: "text c1",
			distance: 0.2,
		});
		expect(searchDocumentChunks).toHaveBeenCalledWith({
			db: fakeDb,
			query: "photosynthesis",
			fileIds: ["f1"],
		});
	});

	it("does not repeat passages already returned in the same message", async () => {
		searchDocumentChunks
			.mockResolvedValueOnce([chunk("c1"), chunk("c2")])
			.mockResolvedValueOnce([chunk("c2"), chunk("c3")]);
		const tool = createDocumentSearchTool({ db: fakeDb, fileIds: ["f1"] });

		await run(tool, "first");
		const second = await run(tool, "second");

		expect(second.status).toBe("ok");
		expect(second.passages.map((p) => p.text)).toEqual(["text c3"]);
	});

	it("tells the model to stop when a search adds nothing new", async () => {
		searchDocumentChunks
			.mockResolvedValueOnce([chunk("c1")])
			.mockResolvedValueOnce([chunk("c1")]);
		const tool = createDocumentSearchTool({ db: fakeDb, fileIds: ["f1"] });

		await run(tool, "first");
		const second = await run(tool, "same thing");

		expect(second.status).toBe("no_new_passages");
		expect(second.passages).toHaveLength(0);
	});

	it("stops searching after the call limit", async () => {
		searchDocumentChunks.mockImplementation(async () => [chunk(crypto.randomUUID())]);
		const tool = createDocumentSearchTool({
			db: fakeDb,
			fileIds: ["f1"],
			maxCalls: 2,
		});

		await run(tool, "a");
		await run(tool, "b");
		const third = await run(tool, "c");

		expect(third.status).toBe("limit_reached");
		expect(searchDocumentChunks).toHaveBeenCalledTimes(2);
	});

	it("returns an error status instead of throwing when the search fails", async () => {
		searchDocumentChunks.mockRejectedValue(new Error("embedding down"));
		const tool = createDocumentSearchTool({ db: fakeDb, fileIds: ["f1"] });

		const result = await run(tool, "anything");

		expect(result.status).toBe("error");
	});
});
