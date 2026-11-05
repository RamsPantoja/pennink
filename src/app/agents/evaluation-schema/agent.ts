import { generateObject, type LanguageModel } from "ai";
import type {
	EvaluationSchemaDraftInput,
	EvaluationSchemaDraftOutput,
} from "./schema";
import { evaluationSchemaDraftOutputSchema } from "./schema";

export const EVALUATION_SCHEMA_SYSTEM_PROMPT = `You write yes/no validation statements for a teacher's exam, which an AI grader checks against students' answer sheets.

Input: the exam, transcribed in order, with the correct answer for each question.

Rules:
- Return exactly one yes/no statement per exam question, in the same order. Do not skip, merge or add questions.
- Each statement states the correct answer as a fact the grader can check, for example: "The student names Paris as the capital of France."
- Keep the statement self-contained: it should make sense without the question text.
- Use the exam's language.
- Do not invent answers. If a question has no correct answer in the text, still write the statement from the question, and say so in the description.
- Optional whenTrue / whenFalse: short notes for the teacher about what each result means. Leave them empty when nothing useful to add.
- Return only the structured output.`;

/** Calls the model once and returns the structured statements. */
export async function generateEvaluationSchemaStatements(
	input: EvaluationSchemaDraftInput,
	model: LanguageModel,
): Promise<EvaluationSchemaDraftOutput> {
	const { object } = await generateObject({
		model,
		system: EVALUATION_SCHEMA_SYSTEM_PROMPT,
		schema: evaluationSchemaDraftOutputSchema,
		prompt: `Schema name: ${input.name}\nDescription: ${input.description ?? ""}\n\nExam:\n${input.exam_text}`,
	});
	return object;
}
