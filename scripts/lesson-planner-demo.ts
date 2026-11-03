/**
 * End-to-end demo of the lesson planner with the real model (needs AWS credentials
 * in the environment, as the chat does). Runs two conversations:
 *   1. NEM (nem_mx), in Spanish, two rounds of questions at most.
 *   2. 5E (5e), in English.
 * Nothing is saved to the database: there is no classroom in this script.
 *
 * Run from the app folder:  npx tsx scripts/lesson-planner-demo.ts
 */
import { chatModel } from "~/app/agents/chat/agent";
import { createLlmClient } from "~/app/agents/lesson-planner/llm";
import { runLessonPlanner, type PlannerDeps } from "~/app/agents/lesson-planner/planner";
import { loadProfiles } from "~/app/agents/lesson-planner/registry";
import type { Draft, LessonPlannerInput, LessonPlannerResult } from "~/app/agents/lesson-planner/schema";

const deps: PlannerDeps = {
	profiles: loadProfiles(),
	llm: createLlmClient(chatModel),
};

const show = (label: string, result: LessonPlannerResult) => {
	console.log(`\n--- ${label}: ${result.status}`);
	if (result.status === "needs_info") {
		console.log(result.message_for_teacher);
		for (const q of result.questions) console.log(` - ${q.field}: ${q.question}`);
	} else if (result.status === "error") {
		console.log(result.message);
	} else if (result.status === "ready_to_generate") {
		console.log(result.summary.join("\n"));
	} else if (result.status === "complete") {
		console.log(result.markdown.slice(0, 1200), "\n[...]");
		console.log("Assumptions:", result.assumptions.join(" | "));
	}
};

/** One conversation: first message, then answers to the questions, then generate. */
const conversation = async (
	name: string,
	first: LessonPlannerInput,
	answers: LessonPlannerInput["draft"],
) => {
	let result = await runLessonPlanner(first, deps);
	show(`${name} round 1`, result);

	if (result.status === "needs_info") {
		const draft: Draft = { ...result.draft, ...(answers as Draft) };
		result = await runLessonPlanner(
			{ action: "update", framework_id: result.framework_id, draft },
			deps,
		);
		show(`${name} round 2`, result);
	}

	if (result.status === "ready_to_generate") {
		result = await runLessonPlanner(
			{ action: "generate", framework_id: result.framework_id, draft: result.draft, decide_missing: true },
			deps,
		);
		show(`${name} generate`, result);
	}
};

await conversation(
	"NEM",
	{
		action: "update",
		new_data:
			"Quiero planear con la NEM para 4° de primaria, campo de saberes. Los niños toman demasiado refresco; son 8 sesiones de 50 minutos. Tú decide lo demás.",
		decide_missing: true,
	},
	{},
);

await conversation(
	"5E",
	{
		action: "update",
		framework_id: "5e",
		new_data: "Grade 6 science, photosynthesis, 4 lessons of 50 minutes.",
	},
	{ minutes_per_session: 50 },
);
