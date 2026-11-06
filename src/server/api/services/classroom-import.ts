import ExcelJS from "exceljs";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, eq, inArray } from "drizzle-orm";
import { classroomStudents, students } from "~/server/db/schema";
import type { TRPCContext } from "../../trpc";
import {
	MAX_STUDENT_IMPORT_BYTES,
	MAX_STUDENT_IMPORT_ROWS,
} from "../schemas/classroom";

export type StudentImportStatus =
	| "new"
	| "existing"
	| "already_enrolled"
	| "invalid"
	| "duplicate_in_file";

export type ParsedStudentRow = {
	rowNumber: number;
	name: string;
	email: string;
	phone: string;
};

export type ClassifiedStudentRow = ParsedStudentRow & {
	status: StudentImportStatus;
	reason?: string;
};

const NAME_HEADERS = new Set(["name", "nombre", "nombre completo", "full name"]);
const EMAIL_HEADERS = new Set(["email", "correo", "correo electronico", "e-mail", "mail"]);
const PHONE_HEADERS = new Set([
	"phone",
	"phone number",
	"telefono",
	"celular",
	"mobile",
	"movil",
]);

const emailSchema = z.string().trim().email().max(320);
const nameSchema = z.string().trim().min(1).max(100);

const normalizeHeader = (value: string) =>
	value
		.normalize("NFD")
		.replace(/\p{M}/gu, "")
		.trim()
		.toLowerCase();

const cellToString = (value: ExcelJS.CellValue): string => {
	if (value === null || value === undefined) return "";
	if (value instanceof Date) return value.toISOString();
	if (typeof value === "object") {
		if ("richText" in value) {
			return value.richText.map((part) => part.text).join("").trim();
		}
		if ("result" in value) return cellToString(value.result);
		if ("text" in value) return String(value.text).trim();
		return "";
	}
	return String(value).trim();
};

export type ParsedWorkbook =
	| { ok: true; rows: ParsedStudentRow[] }
	| { ok: false; message: string };

export const parseStudentsWorkbook = async (
	buffer: Buffer,
): Promise<ParsedWorkbook> => {
	if (buffer.length > MAX_STUDENT_IMPORT_BYTES) {
		return { ok: false, message: "File is larger than 2 MB" };
	}

	const workbook = new ExcelJS.Workbook();
	try {
		await workbook.xlsx.load(buffer);
	} catch {
		return { ok: false, message: "File is not a valid .xlsx workbook" };
	}

	const sheet = workbook.worksheets[0];
	if (!sheet) return { ok: false, message: "Workbook has no sheets" };

	let nameColumn: number | undefined;
	let emailColumn: number | undefined;
	let phoneColumn: number | undefined;
	sheet.getRow(1).eachCell((cell, columnNumber) => {
		const header = normalizeHeader(cellToString(cell.value));
		if (NAME_HEADERS.has(header)) nameColumn ??= columnNumber;
		if (EMAIL_HEADERS.has(header)) emailColumn ??= columnNumber;
		if (PHONE_HEADERS.has(header)) phoneColumn ??= columnNumber;
	});

	if (!nameColumn || !emailColumn) {
		return {
			ok: false,
			message: "The first row must contain 'name' and 'email' columns",
		};
	}

	const rows: ParsedStudentRow[] = [];
	const lastRow = sheet.rowCount;
	for (let rowNumber = 2; rowNumber <= lastRow; rowNumber++) {
		const row = sheet.getRow(rowNumber);
		const name = cellToString(row.getCell(nameColumn).value);
		const email = cellToString(row.getCell(emailColumn).value);
		if (!name && !email) continue;
		const phone = phoneColumn
			? cellToString(row.getCell(phoneColumn).value)
			: "";

		rows.push({ rowNumber, name, email, phone });
		if (rows.length > MAX_STUDENT_IMPORT_ROWS) {
			return {
				ok: false,
				message: `A file can import at most ${MAX_STUDENT_IMPORT_ROWS} students`,
			};
		}
	}

	return { ok: true, rows };
};

export const classifyStudentRows = async (
	db: TRPCContext["db"],
	classroomId: string,
	rows: ParsedStudentRow[],
): Promise<ClassifiedStudentRow[]> => {
	const emails = [...new Set(rows.map((row) => row.email.toLowerCase()))].filter(
		(email) => emailSchema.safeParse(email).success,
	);

	const existingStudents = emails.length
		? await db
				.select({ id: students.id, email: students.email })
				.from(students)
				.where(inArray(students.email, emails))
		: [];
	const enrolled = emails.length
		? await db
				.select({ email: classroomStudents.email })
				.from(classroomStudents)
				.where(
					and(
						eq(classroomStudents.classroomId, classroomId),
						inArray(classroomStudents.email, emails),
					),
				)
		: [];

	const existingEmails = new Set(existingStudents.map((s) => s.email));
	const enrolledEmails = new Set(enrolled.map((e) => e.email));
	const seen = new Set<string>();

	return rows.map((row): ClassifiedStudentRow => {
		const email = row.email.toLowerCase();
		const base = { ...row, email };

		if (!nameSchema.safeParse(row.name).success) {
			return { ...base, status: "invalid", reason: "Missing or too long name" };
		}
		if (!emailSchema.safeParse(email).success) {
			return { ...base, status: "invalid", reason: "Invalid email" };
		}
		if (seen.has(email)) {
			return { ...base, status: "duplicate_in_file", reason: "Repeated in file" };
		}
		seen.add(email);

		if (enrolledEmails.has(email)) {
			return { ...base, status: "already_enrolled", reason: "Already in classroom" };
		}
		return { ...base, status: existingEmails.has(email) ? "existing" : "new" };
	});
};
