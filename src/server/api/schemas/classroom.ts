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

export const createStudentInputSchema = z.object({
	classroomId: classroomIdSchema,
	name: z.string().trim().min(1).max(100),
	email: z.string().trim().email().max(320),
});

export const updateStudentInputSchema = z.object({
	classroomId: classroomIdSchema,
	studentId: z.string().uuid(),
	name: z.string().trim().min(1).max(100),
	email: z.string().trim().email().max(320),
});

export const deleteStudentInputSchema = z.object({
	classroomId: classroomIdSchema,
	studentId: z.string().uuid(),
});
