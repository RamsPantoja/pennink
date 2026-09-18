import { z } from "zod";
import { aiFormSchema } from "~/app/agents/chat/schema";

export const createFormSchema = z.object({
	formData: aiFormSchema,
});

export const getDataSchema = z.object({
	id: z.string().uuid(),
	type: z.enum(["BASIC", "EXAM"]),
});

export const editFormSchema = z.object({
	id: z.string().uuid(),
	formData: aiFormSchema,
});

export const getFormsSchema = z.object({
	type: z.enum(["BASIC", "EXAM"]),
	search: z.string().optional(),
});

export const saveFormResponsesSchema = z.object({
	formId: z.string().uuid(),
	answers: z.any(),
	email: z.string(),
	username: z.string(),
	userId: z.string().uuid().optional(),
	formLinkId: z.string().uuid(),
	formVersionId: z.string().uuid(),
});

export const saveExamResultsSchema = z.object({
	examId: z.string().uuid(),
	answers: z.any(),
	email: z.string(),
	username: z.string(),
	userId: z.string().uuid().optional(),
	examLinkId: z.string().uuid(),
	examVersionId: z.string().uuid(),
	score: z.number().min(0).max(100),
	feedback: z.string(),
});

export const getExamResultsSchema = z.object({
	examLinkId: z.string().uuid(),
});

export const getFormResponsesSchema = z.object({
	formLinkId: z.string().uuid(),
});

export const getExamResultSchema = z.object({
	examResultId: z.string().uuid(),
});

export const getFormResponseSchema = z.object({
	formResponseId: z.string().uuid(),
});
