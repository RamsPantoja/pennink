import { z } from "zod";
import { pageInputSchema, searchSchema } from "./pagination";

const studyPlanIdSchema = z.string().uuid();
const classroomIdSchema = z.string().uuid();

const titleSchema = z.string().trim().min(1).max(150);
const descriptionSchema = z.string().trim().max(1000);
const contentSchema = z.string().max(200_000);

export const studyPlanByIdInputSchema = z.object({
	id: studyPlanIdSchema,
});

export const listStudyPlansInputSchema = pageInputSchema.extend({
	classroomId: classroomIdSchema,
	search: searchSchema,
});

export const listAllStudyPlansInputSchema = pageInputSchema.extend({
	search: searchSchema,
});

export const createStudyPlanInputSchema = z.object({
	title: titleSchema,
	description: descriptionSchema.default(""),
	content: contentSchema.default(""),
	classroomIds: z.array(classroomIdSchema).max(20),
});

export const updateStudyPlanInputSchema = z.object({
	id: studyPlanIdSchema,
	title: titleSchema.optional(),
	description: descriptionSchema.optional(),
	content: contentSchema.optional(),
});

export const importStudyPlanInputSchema = z.object({
	markdown: z.string().max(500_000),
	fallbackTitle: titleSchema.optional(),
	classroomIds: z.array(classroomIdSchema).max(20),
});

export const studyPlanClassroomInputSchema = z.object({
	id: studyPlanIdSchema,
	classroomId: classroomIdSchema,
});

export const studyPlanViewInputSchema = z.object({
	id: studyPlanIdSchema,
	classroomId: classroomIdSchema.optional(),
});

export const setStudyPlanItemInputSchema = z.object({
	id: studyPlanIdSchema,
	classroomId: classroomIdSchema,
	position: z.number().int().min(0),
	completed: z.boolean(),
});
