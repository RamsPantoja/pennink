import { defaultInstructions } from "~/components/EvaluationSchema/definition-form";
import {
	type EvaluationSchemaDefinition,
	evaluationSchemaDefinitionSchema,
} from "~/server/api/schemas/evaluation-schema";
import type {
	EvaluationSchemaDraftInput,
	EvaluationSchemaDraftOutput,
} from "./schema";

export type EvaluationSchemaDraftResult =
	| {
			status: "draft";
			name: string;
			description: string;
			definition: EvaluationSchemaDefinition;
	  }
	| { status: "error"; message: string };

/**
 * Turns the subagent's statements into a stored-shape definition. Keys are generated
 * here (`q_1`, `q_2`, …) so the model never sees them. An empty statement falls back to
 * the default text for its position. The result is validated with the server schema.
 */
export function buildEvaluationSchemaDraft(
	output: EvaluationSchemaDraftOutput,
	input: Pick<EvaluationSchemaDraftInput, "name" | "description">,
): EvaluationSchemaDraftResult {
	const questions = output.questions.map((question, index) => ({
		type: "noul" as const,
		key: `q_${index + 1}`,
		instructions: question.statement.trim() || defaultInstructions(index + 1),
		criteria: {
			...(question.whenTrue?.trim() ? { true: question.whenTrue.trim() } : {}),
			...(question.whenFalse?.trim()
				? { false: question.whenFalse.trim() }
				: {}),
		},
	}));

	const cleaned = questions.map(({ criteria, ...question }) =>
		Object.keys(criteria).length > 0 ? { ...question, criteria } : question,
	);

	const parsed = evaluationSchemaDefinitionSchema.safeParse({
		questions: cleaned,
	});
	if (!parsed.success) {
		const first = parsed.error.issues[0];
		return {
			status: "error",
			message: `The draft is not valid${first ? `: ${first.path.join(".")} ${first.message}` : ""}. Fix the statements and call the tool again.`,
		};
	}

	const name = (input.name || output.name).trim();
	const description = (input.description ?? output.description ?? "").trim();
	return {
		status: "draft",
		name,
		description,
		definition: parsed.data,
	};
}

/** Runs the subagent through an injected generator and never throws. */
export async function runEvaluationSchemaDraft(
	input: EvaluationSchemaDraftInput,
	generate: (
		input: EvaluationSchemaDraftInput,
	) => Promise<EvaluationSchemaDraftOutput>,
): Promise<EvaluationSchemaDraftResult> {
	try {
		const output = await generate(input);
		return buildEvaluationSchemaDraft(output, input);
	} catch (error) {
		return {
			status: "error",
			message: error instanceof Error ? error.message : String(error),
		};
	}
}
