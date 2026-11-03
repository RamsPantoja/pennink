import { tmpdir } from "node:os";
import { join } from "node:path";
import { distributePhases, type SessionGroup } from "../engine";
import type { LlmClient } from "../llm";
import type { PlanContent } from "../schema";
import { loadProfiles } from "../registry";
import type { Profile } from "../schema";

/** Built-in profiles only: the custom folder is pointed at a path that does not exist. */
export const profiles = loadProfiles(
	join(tmpdir(), "lesson-planner-test-no-custom"),
);

export const profileById = (id: string) => {
	const profile = profiles.find((p) => p.id === id);
	if (!profile) throw new Error(`missing test profile ${id}`);
	return profile;
};

export const llmStub = (overrides: Partial<LlmClient> = {}): LlmClient => ({
	extractFields: async () => ({}),
	generatePlan: async () => {
		throw new Error("generatePlan not stubbed");
	},
	adjustPlan: async () => {
		throw new Error("adjustPlan not stubbed");
	},
	profileFromTemplate: async () => {
		throw new Error("profileFromTemplate not stubbed");
	},
	...overrides,
});

/** A plan the model could return for these groups: every column filled, valid criteria. */
export const contentFor = (
	profile: Profile,
	groups: SessionGroup[],
): PlanContent => ({
	title: `Plan de ${profile.name}`,
	purpose: "Propósito de prueba.",
	framework_fields: [],
	sequence: groups.map((group) => ({
		session: group.session,
		phases: group.phases.map((phase) => phase.key),
		name: `Sesión ${group.session}`,
		columns: profile.session_template.map((column) => ({
			key: column.key,
			text: `${column.label} de prueba`,
		})),
	})),
	materials: [],
	final_product: "",
	resources: ["Pizarrón"],
	differentiation: ["Apoyo visual"],
	assessment: {
		approach: profile.assessment.approach,
		instrument_type:
			profile.assessment.instrument_types[0] ?? "lista de cotejo",
		criteria: Array.from(
			{ length: profile.assessment.criteria_min },
			(_, i) => ({
				criterion: `Criterio ${i + 1}`,
				levels: ["Logrado", "En proceso"],
			}),
		),
	},
	family_community_links: [],
	official_items: [],
	assumptions: [],
	warnings: [],
});

/** Groups for a profile's default model and a session count, as the planner builds them. */
export const groupsFor = (profile: Profile, sessions: number) =>
	distributePhases(profile.sequence_models[0]?.phases ?? [], sessions).groups;

export const fieldOf = (profile: Profile, key: string) => {
	const field = profile.fields.find((f) => f.key === key);
	if (!field) throw new Error(`missing field ${key} in ${profile.id}`);
	return field;
};

export const modelAt = (profile: Profile, index: number) => {
	const model = profile.sequence_models[index];
	if (!model)
		throw new Error(`missing sequence model ${index} in ${profile.id}`);
	return model;
};
