import { z } from "zod";

const classroomIdSchema = z.string().uuid();

export const createClassroomInputSchema = z.object({
	name: z.string().trim().min(1).max(100),
});

export const classroomByIdInputSchema = z.object({
	id: classroomIdSchema,
});

export const updateClassroomNameInputSchema = z.object({
	id: classroomIdSchema,
	name: z.string().trim().min(1).max(100),
});

export const deleteClassroomInputSchema = classroomByIdInputSchema;

export const classroomTeacherInputSchema = z.object({
	classroomId: classroomIdSchema,
	userId: z.string().uuid(),
});

export const addClassroomTeacherInputSchema = z.object({
	classroomId: classroomIdSchema,
	email: z.string().trim().email().max(320),
});

export const studentPhoneSchema = z
	.string()
	.trim()
	.max(30)
	.regex(/^[0-9+()\-.\s]*$/, "Invalid phone number")
	.optional()
	.transform((value) => (value ? value : null));

export const createStudentInputSchema = z.object({
	classroomId: classroomIdSchema,
	name: z.string().trim().min(1).max(100),
	email: z.string().trim().email().max(320),
	phone: studentPhoneSchema,
});

export const updateStudentInputSchema = z.object({
	classroomId: classroomIdSchema,
	studentId: z.string().uuid(),
	name: z.string().trim().min(1).max(100),
	email: z.string().trim().email().max(320),
	phone: studentPhoneSchema,
});

export const deleteStudentInputSchema = z.object({
	classroomId: classroomIdSchema,
	studentId: z.string().uuid(),
});

export const MAX_STUDENT_IMPORT_BYTES = 2 * 1024 * 1024;
export const MAX_STUDENT_IMPORT_ROWS = 500;

export const parseStudentImportInputSchema = z.object({
	classroomId: classroomIdSchema,
	fileName: z.string().max(255),
	fileBase64: z
		.string()
		.max(Math.ceil((MAX_STUDENT_IMPORT_BYTES * 4) / 3) + 4),
});

export const importStudentRowSchema = z.object({
	name: z.string().trim().min(1).max(100),
	email: z.string().trim().email().max(320),
	phone: studentPhoneSchema,
});

export const importStudentsInputSchema = z.object({
	classroomId: classroomIdSchema,
	rows: z.array(importStudentRowSchema).min(1).max(MAX_STUDENT_IMPORT_ROWS),
});
