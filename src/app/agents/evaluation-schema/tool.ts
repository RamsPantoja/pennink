import { tool } from "ai";
import { chatModel } from "~/app/agents/chat/agent";
import { generateEvaluationSchemaStatements } from "./agent";
import {
	type EvaluationSchemaDraftResult,
	runEvaluationSchemaDraft,
} from "./draft";
import { evaluationSchemaDraftInputSchema } from "./schema";

const description = `Draft a yes/no validation schema from a teacher's exam with its correct answers. A subagent writes one yes/no statement per exam question. The draft is shown to the teacher, who reviews and saves it in the schema editor. Nothing is saved by this tool.

How to use it:
1. Read the whole exam the teacher pasted or attached: text, PDF or images. Include every question, in order, with its correct answer.
2. Put that transcription in exam_text. Do not summarize or leave questions out.
3. If an answer is missing or unreadable, ask the teacher with askUser before calling this tool.
4. Give a short name, usually the exam title.`;

export const createEvaluationSchemaDraftTool = ({
	model = chatModel,
}: {
	model?: Parameters<typeof generateEvaluationSchemaStatements>[1];
} = {}) =>
	tool({
		description,
		inputSchema: evaluationSchemaDraftInputSchema,
		execute: (input): Promise<EvaluationSchemaDraftResult> =>
			runEvaluationSchemaDraft(input, (value) =>
				generateEvaluationSchemaStatements(value, model),
			),
	});
