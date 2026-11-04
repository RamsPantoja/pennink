import { describe, expect, it } from "vitest";
import { groupFilesByStudent, studentNameFromSlug } from "../grouping";

describe("studentNameFromSlug", () => {
	it("turns folder slugs into readable names", () => {
		expect(studentNameFromSlug("juan-perez")).toBe("Juan Perez");
		expect(studentNameFromSlug("ana_maria  lopez")).toBe("Ana Maria Lopez");
	});
});

describe("groupFilesByStudent", () => {
	it("groups pages by the folder directly above each file", () => {
		const result = groupFilesByStudent([
			{ name: "page-02.png", path: "juan-perez/page-02.png" },
			{ name: "page-01.png", path: "juan-perez/page-01.png" },
			{ name: "page-01.jpg", path: "ana-lopez/page-01.jpg" },
		]);

		expect(result.unassigned).toEqual([]);
		expect(result.students.map((s) => s.studentName)).toEqual([
			"Ana Lopez",
			"Juan Perez",
		]);
		const juan = result.students[1];
		expect(juan?.pages.map((p) => [p.file.name, p.pageNo])).toEqual([
			["page-01.png", 1],
			["page-02.png", 2],
		]);
	});

	it("ignores a wrapper folder at the top of the zip", () => {
		const result = groupFilesByStudent([
			{ name: "page-01.png", path: "exam-03/juan-perez/page-01.png" },
		]);
		expect(result.students[0]?.studentName).toBe("Juan Perez");
	});

	it("reports a file at the zip root instead of guessing a student", () => {
		const result = groupFilesByStudent([
			{ name: "juan-perez_p1.png", path: "juan-perez_p1.png" },
		]);

		expect(result.students).toEqual([]);
		expect(result.unassigned).toHaveLength(1);
		expect(result.unassigned[0]?.reason).toMatch(/student folder/);
	});

	it("renumbers pages so duplicate numbers do not collide", () => {
		const result = groupFilesByStudent([
			{ name: "page-1.png", path: "juan/page-1.png" },
			{ name: "scan-1.png", path: "juan/scan-1.png" },
		]);
		expect(result.students[0]?.pages.map((p) => p.pageNo)).toEqual([1, 2]);
	});
});
