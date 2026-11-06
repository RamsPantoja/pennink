import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { parseStudentsWorkbook } from "~/server/api/services/classroom-import";

const buildWorkbook = async (rows: unknown[][]) => {
	const workbook = new ExcelJS.Workbook();
	const sheet = workbook.addWorksheet("Students");
	sheet.addRows(rows);
	return Buffer.from(await workbook.xlsx.writeBuffer());
};

describe("parseStudentsWorkbook", () => {
	it("reads English headers and keeps row numbers", async () => {
		const buffer = await buildWorkbook([
			["Name", "Email"],
			["Ana Pérez", "ana@example.com"],
			["Luis", "luis@example.com"],
		]);

		const result = await parseStudentsWorkbook(buffer);

		expect(result).toEqual({
			ok: true,
			rows: [
				{ rowNumber: 2, name: "Ana Pérez", email: "ana@example.com", phone: "" },
				{ rowNumber: 3, name: "Luis", email: "luis@example.com", phone: "" },
			],
		});
	});

	it("reads an optional phone column", async () => {
		const buffer = await buildWorkbook([
			["Name", "Email", "Phone"],
			["Ana", "ana@example.com", "+52 555 123 4567"],
			["Luis", "luis@example.com", null],
		]);

		const result = await parseStudentsWorkbook(buffer);

		expect(result.ok && result.rows.map((row) => row.phone)).toEqual([
			"+52 555 123 4567",
			"",
		]);
	});

	it("accepts a Spanish telefono header", async () => {
		const buffer = await buildWorkbook([
			["Nombre", "Correo", "Teléfono"],
			["Ana", "ana@example.com", "5551234"],
		]);

		const result = await parseStudentsWorkbook(buffer);

		expect(result.ok && result.rows[0]?.phone).toBe("5551234");
	});

	it("accepts Spanish headers in any order and ignores extra columns", async () => {
		const buffer = await buildWorkbook([
			["Grupo", "Correo", "Nombre"],
			["A", "maria@example.com", "María"],
		]);

		const result = await parseStudentsWorkbook(buffer);

		expect(result).toEqual({
			ok: true,
			rows: [{ rowNumber: 2, name: "María", email: "maria@example.com", phone: "" }],
		});
	});

	it("skips blank rows", async () => {
		const buffer = await buildWorkbook([
			["name", "email"],
			["Ana", "ana@example.com"],
			[],
			[null, null],
			["Luis", "luis@example.com"],
		]);

		const result = await parseStudentsWorkbook(buffer);

		expect(result.ok && result.rows.map((row) => row.rowNumber)).toEqual([2, 5]);
	});

	it("rejects a file without name and email columns", async () => {
		const buffer = await buildWorkbook([
			["Name", "Phone"],
			["Ana", "123"],
		]);

		const result = await parseStudentsWorkbook(buffer);

		expect(result.ok).toBe(false);
	});

	it("rejects bytes that are not an xlsx workbook", async () => {
		const result = await parseStudentsWorkbook(Buffer.from("not a workbook"));

		expect(result).toEqual({
			ok: false,
			message: "File is not a valid .xlsx workbook",
		});
	});

	it("rejects more than 500 students", async () => {
		const rows: unknown[][] = [["name", "email"]];
		for (let i = 0; i < 501; i++) rows.push([`S${i}`, `s${i}@example.com`]);
		const buffer = await buildWorkbook(rows);

		const result = await parseStudentsWorkbook(buffer);

		expect(result.ok).toBe(false);
	});
});
