import { describe, expect, it } from "vitest";
import { distributePhases } from "../engine";
import { runLessonPlanner, type PlannerDeps } from "../planner";
import type { LessonPlannerInput } from "../schema";
import fiveERaw from "../profiles/5e.json";
import {
	contentFor,
	groupsFor,
	llmStub,
	profileById,
	profiles,
	modelAt,
} from "./helpers";

const deps = (
	llm: ReturnType<typeof llmStub>,
	savePlan?: PlannerDeps["savePlan"],
): PlannerDeps => ({
	profiles,
	llm,
	savePlan,
});

const nemDraft = {
	grade: "4_primaria",
	campo_formativo: "saberes_pensamiento_cientifico",
	problematica: "Los niños beben demasiado refresco",
	sessions: 8,
	minutes_per_session: 50,
};

describe("lessonPlanner", () => {
	it("asks for a framework when none is given or named", async () => {
		const result = await runLessonPlanner(
			{
				action: "update",
				new_data: "Quiero planear una clase de fracciones para cuarto",
			},
			deps(llmStub()),
		);

		expect(result.status).toBe("needs_framework");
		if (result.status !== "needs_framework") return;
		expect(result.options.map((o) => o.id)).toEqual(
			expect.arrayContaining([
				"nem_mx",
				"ubd",
				"5e",
				"pbl",
				"direct_instruction",
				"generic",
			]),
		);
	});

	it("plans with the NEM profile from one message when the teacher says 'you decide'", async () => {
		const llm = llmStub({
			extractFields: async () => ({
				grade: "4_primaria",
				campo_formativo: "saberes",
				problematica: "Los niños beben demasiado refresco",
				sessions: 8,
				minutes_per_session: 50,
			}),
			generatePlan: async ({ profile, groups }) => contentFor(profile, groups),
		});

		const ready = await runLessonPlanner(
			{
				action: "update",
				new_data:
					"NEM, 4° primaria, saberes, kids drink too much soda, 8 sessions of 50 min, you decide",
				decide_missing: true,
			},
			deps(llm),
		);

		expect(ready.status).toBe("ready_to_generate");
		if (ready.status !== "ready_to_generate") return;
		expect(ready.framework_id).toBe("nem_mx");
		expect(ready.derived.fase).toBe("4");

		const done = await runLessonPlanner(
			{
				action: "generate",
				framework_id: "nem_mx",
				draft: ready.draft,
				decide_missing: true,
			},
			deps(llm),
		);

		expect(done.status).toBe("complete");
		if (done.status !== "complete") return;
		expect(done.plan.sequence_model_id).toBe("indagacion_steam");
		expect(done.plan.sequence).toHaveLength(8);
		expect(new Set(done.plan.sequence.flatMap((s) => s.phases)).size).toBe(5);
		expect(done.assumptions.length).toBeGreaterThan(0);
		expect(done.markdown).toContain("| Fase | 4 |");
		expect(done.markdown).toContain("| Grado o nivel | 4° de primaria |");
	});

	it("covers all five 5E phases in three sessions and records the grouping", async () => {
		const llm = llmStub({
			generatePlan: async ({ profile, groups }) => contentFor(profile, groups),
		});
		const ready = await runLessonPlanner(
			{
				action: "update",
				framework_id: "5e",
				new_data: {
					grade: "5",
					topic: "Ecosistemas",
					sessions: 3,
					minutes_per_session: 50,
				},
				decide_missing: true,
			},
			deps(llm),
		);
		if (ready.status !== "ready_to_generate") throw new Error(ready.status);

		const done = await runLessonPlanner(
			{
				action: "generate",
				framework_id: "5e",
				draft: ready.draft,
				decide_missing: true,
			},
			deps(llm),
		);

		expect(done.status).toBe("complete");
		if (done.status !== "complete") return;
		expect(done.plan.sequence).toHaveLength(3);
		expect(new Set(done.plan.sequence.flatMap((s) => s.phases))).toEqual(
			new Set(["engage", "explore", "explain", "elaborate", "evaluate"]),
		);
		expect(done.assumptions.some((a) => a.includes("3 sesiones"))).toBe(true);
	});

	it("keeps the official text the teacher pasted, verified and literal", async () => {
		const pasted =
			"CCSS.MATH.CONTENT.5.NF.A.1 Add and subtract fractions with unlike denominators.";
		const llm = llmStub({
			generatePlan: async ({ profile, groups }) => ({
				...contentFor(profile, groups),
				official_items: [
					{ field: "standards", text: "Approximation", verified: false },
				],
			}),
		});
		const ready = await runLessonPlanner(
			{
				action: "update",
				framework_id: "ubd",
				new_data: {
					grade: "5",
					subject: "Math",
					topic: "Fractions",
					sessions: 4,
					minutes_per_session: 45,
					standards: pasted,
				},
				decide_missing: true,
			},
			deps(llm),
		);
		if (ready.status !== "ready_to_generate") throw new Error(ready.status);

		const done = await runLessonPlanner(
			{
				action: "generate",
				framework_id: "ubd",
				draft: ready.draft,
				decide_missing: true,
			},
			deps(llm),
		);

		expect(done.status).toBe("complete");
		if (done.status !== "complete") return;
		expect(done.plan.official_items).toEqual([
			{ field: "standards", text: pasted, verified: true },
		]);
		expect(done.warnings.some((w) => w.includes("no se proporcionó"))).toBe(
			false,
		);
	});

	it("marks official text as unverified with a warning when the teacher did not give it", async () => {
		const llm = llmStub({
			generatePlan: async ({ profile, groups }) => ({
				...contentFor(profile, groups),
				official_items: [
					{ field: "standards", text: "Approximation", verified: false },
				],
			}),
		});
		const draft = {
			grade: "5",
			subject: "Math",
			topic: "Fractions",
			sessions: 4,
			minutes_per_session: 45,
		};

		const done = await runLessonPlanner(
			{ action: "generate", framework_id: "ubd", draft, decide_missing: true },
			deps(llm),
		);

		expect(done.status).toBe("complete");
		if (done.status !== "complete") return;
		expect(done.plan.official_items).toEqual([
			{ field: "standards", text: "Approximation", verified: false },
		]);
		expect(done.warnings.some((w) => w.includes("no se proporcionó"))).toBe(
			true,
		);
	});

	it("never asks again for fields already in the draft, and asks optional ones once", async () => {
		const base = { framework_id: "5e", decide_missing: false } as const;

		const first = await runLessonPlanner(
			{
				...base,
				action: "update",
				draft: { grade: "5", topic: "Ecosistemas", sessions: 3 },
			},
			deps(llmStub()),
		);
		expect(first.status).toBe("needs_info");
		if (first.status !== "needs_info") return;
		expect(first.questions.map((q) => q.field)).toEqual([
			"minutes_per_session",
		]);

		const second = await runLessonPlanner(
			{
				...base,
				action: "update",
				draft: { ...first.draft, minutes_per_session: 50 },
			},
			deps(llmStub()),
		);
		expect(second.status).toBe("needs_info");
		if (second.status !== "needs_info") return;
		const asked = second.questions.map((q) => q.field);
		expect(asked).not.toEqual(
			expect.arrayContaining([
				"grade",
				"topic",
				"sessions",
				"minutes_per_session",
			]),
		);

		const third = await runLessonPlanner(
			{ ...base, action: "update", draft: second.draft },
			deps(llmStub()),
		);
		expect(third.status).toBe("ready_to_generate");
	});

	it("reports a clear error for an invalid custom profile", async () => {
		const result = await runLessonPlanner(
			{ action: "update", custom_profile: { id: "Bad Id", name: "x" } },
			deps(llmStub()),
		);

		expect(result.status).toBe("error");
		if (result.status !== "error") return;
		expect(result.message).toContain("Invalid lesson profile (custom_profile)");
	});

	it("turns a pasted school template into a temporary profile the teacher confirms", async () => {
		const schoolProfile = {
			...fiveERaw,
			id: "escuela_demo",
			name: "Formato escolar",
		};
		const llm = llmStub({
			profileFromTemplate: async () => schoolProfile,
			generatePlan: async ({ profile, groups }) => contentFor(profile, groups),
		});

		const proposed = await runLessonPlanner(
			{ action: "update", school_template_text: "Inicio\nDesarrollo\nCierre" },
			deps(llm),
		);
		expect(proposed.status).toBe("needs_confirmation");
		if (proposed.status !== "needs_confirmation") return;
		expect(proposed.profile.id).toBe("escuela_demo");

		const ready = await runLessonPlanner(
			{
				action: "update",
				custom_profile: proposed.profile,
				new_data: {
					grade: "6",
					topic: "Ecosistemas",
					sessions: 5,
					minutes_per_session: 50,
				},
				decide_missing: true,
			},
			deps(llm),
		);
		expect(ready.status).toBe("ready_to_generate");
		if (ready.status !== "ready_to_generate") return;
		expect(ready.framework_id).toBe("escuela_demo");
	});

	it("retries once when the model's output is not valid, then succeeds", async () => {
		let calls = 0;
		const seenProblems: string[][] = [];
		const llm = llmStub({
			generatePlan: async ({ profile, groups, problems }) => {
				calls++;
				seenProblems.push(problems ?? []);
				if (calls === 1) throw new Error("No object generated: invalid JSON");
				return contentFor(profile, groups);
			},
		});

		const done = await runLessonPlanner(
			{
				action: "generate",
				framework_id: "5e",
				draft: { grade: "5", topic: "x", sessions: 5, minutes_per_session: 50 },
				decide_missing: true,
			},
			deps(llm),
		);

		expect(done.status).toBe("complete");
		expect(calls).toBe(2);
		expect(seenProblems[1]?.[0]).toContain("not valid output");
	});

	it("returns a clear error after the retry when the output keeps missing a phase", async () => {
		let calls = 0;
		const llm = llmStub({
			generatePlan: async ({ profile, groups }) => {
				calls++;
				return { ...contentFor(profile, groups), sequence: [] };
			},
		});

		const result = await runLessonPlanner(
			{
				action: "generate",
				framework_id: "5e",
				draft: { grade: "5", topic: "x", sessions: 5, minutes_per_session: 50 },
				decide_missing: true,
			},
			deps(llm),
		);

		expect(calls).toBe(2);
		expect(result.status).toBe("needs_info");
		if (result.status !== "needs_info") return;
		expect(result.message_for_teacher).toBe(
			"I could not build the plan yet. To complete it, tell me:",
		);
		expect(result.message_for_teacher).not.toContain("not valid output");
		expect(result.questions.map((q) => q.field)).toEqual([
			"subject",
			"group_size",
			"student_needs",
			"resources",
		]);
	});

	it("asks for details when the field extraction fails, instead of an error", async () => {
		const llm = llmStub({
			extractFields: async () => {
				throw new Error("No object generated: response did not match schema.");
			},
		});

		const result = await runLessonPlanner(
			{
				action: "update",
				framework_id: "5e",
				new_data: "Quiero una clase de ecosistemas",
			},
			deps(llm),
		);

		expect(result.status).toBe("needs_info");
		if (result.status !== "needs_info") return;
		expect(result.questions.map((q) => q.field)).toEqual([
			"grade",
			"topic",
			"sessions",
			"minutes_per_session",
		]);
		expect(result.message_for_teacher).not.toContain("did not match schema");
	});

	it("re-maps a NEM plan to PBL and asks only for the missing PBL required fields", async () => {
		const llm = llmStub({
			generatePlan: async ({ profile, groups }) => contentFor(profile, groups),
			adjustPlan: async ({ profile }) => ({
				...contentFor(
					profile,
					distributePhases(modelAt(profile, 0).phases, 8).groups,
				),
				changes: ["Cambié el marco a PBL"],
			}),
		});
		const made = await runLessonPlanner(
			{
				action: "generate",
				framework_id: "nem_mx",
				draft: nemDraft,
				decide_missing: true,
			},
			deps(llm),
		);
		if (made.status !== "complete") throw new Error(made.status);

		const asking = await runLessonPlanner(
			{
				action: "adjust",
				framework_id: "pbl",
				current_plan: made.plan,
				adjust_instruction: "switch framework to pbl",
			},
			deps(llm),
		);
		expect(asking.status).toBe("needs_info");
		if (asking.status !== "needs_info") return;
		expect(asking.questions.map((q) => q.field)).toEqual(["subject", "topic"]);

		const switched = await runLessonPlanner(
			{
				action: "adjust",
				framework_id: "pbl",
				current_plan: made.plan,
				adjust_instruction: "switch framework to pbl",
				draft: { subject: "Ciencias", topic: "Ecosistemas" },
			},
			deps(llm),
		);
		expect(switched.status).toBe("complete");
		if (switched.status !== "complete") return;
		expect(switched.plan.framework_id).toBe("pbl");
		expect(switched.changes).toEqual(["Cambié el marco a PBL"]);
		expect(switched.assumptions.some((a) => a.includes("re-mapeado"))).toBe(
			true,
		);
	});

	it("saves the complete plan as a lesson plan and says so when there is no classroom", async () => {
		const llm = llmStub({
			generatePlan: async ({ profile, groups }) => contentFor(profile, groups),
		});
		const saved: { title: string; content: string }[] = [];
		const withClassroom = await runLessonPlanner(
			{
				action: "generate",
				framework_id: "5e",
				draft: { grade: "5", topic: "x", sessions: 5, minutes_per_session: 50 },
				decide_missing: true,
			},
			deps(llm, async (input) => {
				saved.push(input);
				return "plan-1";
			}),
		);
		const withoutClassroom = await runLessonPlanner(
			{
				action: "generate",
				framework_id: "5e",
				draft: { grade: "5", topic: "x", sessions: 5, minutes_per_session: 50 },
				decide_missing: true,
			},
			deps(llm),
		);

		expect(
			withClassroom.status === "complete" && withClassroom.plan_artifact_id,
		).toBe("plan-1");
		expect(saved[0]?.content).toContain("# Plan de");
		expect(
			withoutClassroom.status === "complete" &&
				withoutClassroom.plan_artifact_id,
		).toBe(null);
		expect(
			withoutClassroom.status === "complete" &&
				withoutClassroom.warnings.join(" "),
		).toContain("no active classroom");
	});

	it("does not invent a framework from a generic request", async () => {
		const result = await runLessonPlanner(
			{
				action: "update",
				new_data: "Plan de clase de lectura",
			} satisfies LessonPlannerInput,
			deps(llmStub()),
		);
		expect(result.status).toBe("needs_framework");
	});

	it("keeps group sessions available for tests that need them", () => {
		expect(groupsFor(profileById("5e"), 2)).toHaveLength(2);
	});
});
