import { type InferUITool, tool } from "ai-v5";
import z from "zod";

// First, define the schema for QuestionOption if needed
const questionOptionSchema = z.object({
	value: z.string(),
	label: z.string(),
});

// Then define the main Question schema
export const questionSchema = z.object({
	key: z.string().describe("KEY of the question field for the form"),
	type: z
		.enum([
			"text",
			"textarea",
			"checkbox",
			"radio",
			"select",
			"switch",
			"slider",
			"email",
			"number",
			"date",
		])
		.describe("Type of field"),
	label: z.string().describe("Label of the field"),
	placeholder: z.string().optional().describe("Placeholder text for the field"),
	required: z
		.boolean()
		.describe(
			"Whether the field is required (for exams or quizzes required is false)",
		),
	options: z
		.array(questionOptionSchema)
		.optional()
		.describe("Options for the field"),
	min: z.number().optional().describe("Minimum value for the field"),
	max: z.number().optional().describe("Maximum value for the field"),
	step: z.number().optional().describe("Step value for the field"),
	description: z.string().optional().describe("Description of the field"),
	answer: z.any().optional().describe("Correct answer for the field"),
});

export const aiFormSchema = z.object({
	title: z.string().describe("Title of the form"),
	description: z.string().describe("Description or instructions of the form"),
	questions: z.array(questionSchema).describe("Questions of the form"),
	type: z.enum(["BASIC", "EXAM"]).describe("Type of form"),
	isEdited: z.boolean().describe("Whether the form has been edited"),
});

export type AiForm = z.infer<typeof aiFormSchema>;

export const generateAndEditForm = tool({
	description: "Tool for generating or editing forms and exams",
	inputSchema: aiFormSchema,
	execute: async ({ title, description, questions, type }) => {
		return {
			title,
			description,
			questions,
			type,
		};
	},
});

export type GenerateAndEditFormTool = InferUITool<typeof generateAndEditForm>;
