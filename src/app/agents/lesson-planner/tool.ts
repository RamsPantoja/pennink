import { tool } from "ai";
import { chatModel } from "~/app/agents/chat/agent";
import { db } from "~/server/db";
import { PlanArtifactService } from "~/server/api/services/plan-artifact";
import { createLlmClient } from "./llm";
import { runLessonPlanner } from "./planner";
import { loadProfiles } from "./registry";
import { lessonPlannerInputSchema, type LessonPlannerResult } from "./schema";

const description = `Plan a lesson or unit step by step under a chosen framework (NEM, UbD, 5E, PBL, direct instruction, or a generic plan, or a school's own template). The tool asks the questions it needs and generates the complete plan in Markdown, saved as a lesson plan the teacher can open and edit.

How to use the loop:
1. Call with action "update" whenever the teacher gives planning data. Pass new_data as the teacher's words (or structured values keyed by field), and pass back the draft and framework_id from the previous result.
2. Ask the result's questions as returned, without rewriting them much: with askUser when they have options or are open, then call "update" again with the answers.
3. Call "generate" only when the status is "ready_to_generate" and the teacher confirms, or says "you decide" (then also set decide_missing true). Pass the draft.
4. When the result is "complete", show the markdown. Keep the visible response short if the plan is long: summarize and point to the plan.
5. "adjust" changes a complete plan: pass current_plan (the plan object) and adjust_instruction. To switch framework, also pass framework_id.
6. A school template pasted as school_template_text returns "needs_confirmation" with a profile. Show the summary; after the teacher confirms, call "update" with that profile as custom_profile.
If the framework is unclear, the result is "needs_framework": show the options and ask which one.`;

const todayIso = () => {
	const now = new Date();
	const pad = (value: number) => String(value).padStart(2, "0");
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const createLessonPlannerTool = ({
	userId,
	activeClassroomId,
}: {
	userId: string;
	activeClassroomId?: string | null;
}) => {
	const service = new PlanArtifactService({ db });

	return tool({
		description,
		inputSchema: lessonPlannerInputSchema,
		execute: async (input): Promise<LessonPlannerResult> => {
			try {
				return await runLessonPlanner(input, {
					profiles: loadProfiles(),
					llm: createLlmClient(chatModel),
					savePlan: activeClassroomId
						? async ({ title, content }) => {
								const today = todayIso();
								const plan = await service.create(
									{
										classroomId: activeClassroomId,
										title,
										range: "lesson",
										startDate: today,
										endDate: today,
										content,
									},
									userId,
								);
								return plan.id;
							}
						: undefined,
				});
			} catch (error) {
				return {
					status: "error",
					message: error instanceof Error ? error.message : String(error),
				};
			}
		},
	});
};
