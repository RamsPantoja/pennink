import { describe, expect, it } from "vitest";
import { buildRunCsv, escapeCsvCell } from "../csv";

describe("escapeCsvCell", () => {
	it("quotes commas, quotes and line breaks", () => {
		expect(escapeCsvCell("a,b")).toBe('"a,b"');
		expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
		expect(escapeCsvCell("line\nbreak")).toBe('"line\nbreak"');
		expect(escapeCsvCell(null)).toBe("");
		expect(escapeCsvCell(42)).toBe("42");
	});
});

describe("buildRunCsv", () => {
	it("writes one row per student with a column per question", () => {
		const csv = buildRunCsv(
			["has_name", "diagram"],
			[
				{
					studentName: "Juan Perez, Jr.",
					status: "graded",
					score: 95,
					answers: {
						has_name: { type: "noul", score: 95, flagged: false },
						diagram: {
							type: "choice",
							score: null,
							label: "cell",
							flagged: true,
						},
					},
				},
				{ studentName: "Ana", status: "failed", score: null, answers: null },
			],
		);

		expect(csv.split("\r\n")).toEqual([
			"Student,Status,Total,has_name,diagram,Flagged",
			'"Juan Perez, Jr.",graded,95,95,cell,1',
			"Ana,failed,,,,0",
		]);
	});
});
