import { z } from "zod";
import { aiFormSchema } from "~/lib/schemas/aiForm";

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
