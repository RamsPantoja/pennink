import { z } from "zod";
import { aiFormSchema } from "~/app/agents/chat/schema";
import { pageInputSchema } from "./pagination";

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

export const getFormsSchema = pageInputSchema.extend({
	type: z.enum(["BASIC", "EXAM"]),
	search: z.string().optional(),
});

export const deleteFormSchema = z.object({
	id: z.string().uuid(),
	type: z.enum(["BASIC", "EXAM"]),
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

// The score and feedback are computed on the server, so the client only sends answers.
export const submitExamSchema = z.object({
	examLinkId: z.string().uuid(),
	answers: z.record(z.string(), z.any()),
	email: z.string(),
	username: z.string(),
	userId: z.string().uuid().optional(),
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
