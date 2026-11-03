import { generateObject, type LanguageModel } from "ai";
import { z } from "zod";
import type { SessionGroup } from "./engine";
import {
	ASKED_KEY,
	planContentSchema,
	profileShapeSchema,
	type Draft,
	type PlanContent,
	type Profile,
	type SequenceModel,
} from "./schema";

/** The model's output when adjusting a plan: the full plan plus the list of changes. */
const adjustedPlanSchema = planContentSchema.extend({
	changes: z.array(z.string()),
});

export type AdjustedPlan = PlanContent & { changes: string[] };

export type PlanRequest = {
	profile: Profile;
	draft: Draft;
	derived: Record<string, string>;
	model: SequenceModel;
	groups: SessionGroup[];
	language: string;
	/** Validation problems from the previous attempt, if any. */
	problems?: string[];
};

export type AdjustRequest = {
	profile: Profile;
	currentPlan: PlanContent;
	instruction: string;
	language: string;
	/** Set when the framework changed: the previous plan is re-mapped to this profile. */
	remapFrom?: string;
	problems?: string[];
};

export type LlmClient = {
	extractFields(input: {
		profile: Profile;
		text: string;
		draft: Draft;
	}): Promise<Record<string, unknown>>;
	generatePlan(input: PlanRequest): Promise<PlanContent>;
	adjustPlan(input: AdjustRequest): Promise<AdjustedPlan>;
	profileFromTemplate(text: string, problems?: string[]): Promise<unknown>;
};

const BASE_SYSTEM = `You help K-12 teachers plan lessons and units. Write practical, concrete plans that a teacher can use in class as they are: say what the teacher does and what the students do, in short instructions the teacher can read aloud.
Follow the framework rules exactly. Never invent official curriculum text, standards, codes, page numbers, resource titles or student data. Put anything you decided for the teacher in "assumptions". Return only the structured output.`;

const frameworkBlock = (profile: Profile) =>
	[
		`Framework: ${profile.name}. ${profile.description}`,
		profile.content_rules.length
			? `Framework rules:\n${profile.content_rules.map((rule) => `- ${rule}`).join("\n")}`
			: "",
		profile.glossary.length
			? `Use these terms exactly as written: ${profile.glossary.join("; ")}.`
			: "",
	]
		.filter(Boolean)
		.join("\n");

const officialBlock = (profile: Profile, draft: Draft) => {
	if (profile.official_text_fields.length === 0) return "";
	const lines = profile.official_text_fields.map((key) => {
		const field = profile.fields.find((f) => f.key === key);
		const supplied = draft[key];
		return typeof supplied === "string" && supplied.trim()
			? `- ${field?.label ?? key}: the teacher supplied it; copy it exactly as "official_items" text, verified will be set by the system.`
			: `- ${field?.label ?? key}: not supplied. Write a short approximation in "official_items" with verified false, and do not present it as official.`;
	});
	return `Official text fields:\n${lines.join("\n")}`;
};

const draftBlock = (
	profile: Profile,
	draft: Draft,
	derived: Record<string, string>,
) => {
	const lines = profile.fields
		.filter((field) => {
			const value = draft[field.key];
			return (
				value !== undefined &&
				value !== "" &&
				!(Array.isArray(value) && value.length === 0)
			);
		})
		.map((field) => {
			const value = draft[field.key];
			const shown = Array.isArray(value)
				? value
						.map((v) => field.options?.find((o) => o.value === v)?.label ?? v)
						.join(", ")
				: (field.options?.find((o) => o.value === value)?.label ??
					String(value));
			return `- ${field.label}: ${shown}`;
		});
	for (const rule of profile.derived_fields) {
		if (derived[rule.key]) lines.push(`- ${rule.label}: ${derived[rule.key]}`);
	}
	return `Teacher data:\n${lines.join("\n")}`;
};

const sequenceBlock = (
	profile: Profile,
	model: SequenceModel,
	groups: SessionGroup[],
) => {
	const columns = profile.session_template
		.map((c) => `${c.key} (${c.label})`)
		.join(", ");
	const lines = groups.map(
		(group) =>
			`- session ${group.session}: phases [${group.phases.map((p) => p.key).join(", ")}] = ${group.phases.map((p) => p.label).join(" + ")}`,
	);
	return [
		`Sequence model: ${model.label}. Write one "sequence" entry per session below, with "phases" set to exactly those keys:`,
		...lines,
		`Each entry needs the columns: ${columns}. Every column must be filled; the timing across the columns must add up to the session minutes.`,
	].join("\n");
};

const assessmentBlock = (profile: Profile) => {
	const a = profile.assessment;
	return `Assessment: approach ${a.approach}. Use instruments from: ${a.instrument_types.join(", ")}. Write between ${a.criteria_min} and ${a.criteria_max} criteria, each with its levels.`;
};

const problemsBlock = (problems?: string[]) =>
	problems?.length
		? `\nYour previous answer had these problems. Fix all of them:\n${problems.map((p) => `- ${p}`).join("\n")}`
		: "";

/** Schema for the extraction step: one optional key per profile field. */
const extractionSchema = (profile: Profile) =>
	z.object(
		Object.fromEntries(
			profile.fields.map((field) => {
				const options = field.options?.map((o) => o.value).join(", ");
				const base =
					field.type === "number"
						? z.number()
						: field.type === "multi_enum"
							? z.array(z.string())
							: z.string();
				const described = options ? base.describe(`One of: ${options}`) : base;
				return [field.key, described.nullable()];
			}),
		),
	);

export const createLlmClient = (model: LanguageModel): LlmClient => ({
	async extractFields({ profile, text, draft }) {
		const known = Object.keys(draft).filter((key) => key !== ASKED_KEY);
		const { object } = await generateObject({
			model,
			schema: extractionSchema(profile),
			system: `${BASE_SYSTEM}\nRead the teacher's message and extract the values for these fields of the framework "${profile.name}". Use null for anything the message does not say. Enum fields must use one of the listed values. Do not guess.`,
			prompt: `Fields already known (do not change them unless the message corrects them): ${known.join(", ") || "none"}.\nMessage: """${text}"""`,
		});
		return Object.fromEntries(
			Object.entries(object as Record<string, unknown>).filter(
				([, value]) => value !== null,
			),
		);
	},

	async generatePlan({
		profile,
		draft,
		derived,
		model: sequence,
		groups,
		language,
		problems,
	}) {
		const { object } = await generateObject({
			model,
			schema: planContentSchema,
			system: BASE_SYSTEM,
			prompt: [
				frameworkBlock(profile),
				`Output language: ${language}. Write every text in this language.`,
				draftBlock(profile, draft, derived),
				sequenceBlock(profile, sequence, groups),
				assessmentBlock(profile),
				officialBlock(profile, draft),
				`Framework fields: add one entry to "framework_fields" for each framework element that applies (for example each selected axis, the scenario, or the stage goals), saying how it is addressed.`,
				`Every "sessions" entry needs a name. Include "materials", "resources", "differentiation" (at least one reasonable adjustment), and "family_community_links" when they apply.`,
				problemsBlock(problems),
			]
				.filter(Boolean)
				.join("\n\n"),
		});
		return object;
	},

	async adjustPlan({
		profile,
		currentPlan,
		instruction,
		language,
		remapFrom,
		problems,
	}) {
		const { object } = await generateObject({
			model,
			schema: adjustedPlanSchema,
			system: BASE_SYSTEM,
			prompt: [
				frameworkBlock(profile),
				`Output language: ${language}.`,
				remapFrom
					? `The plan was written for the framework "${remapFrom}". Re-map its content to "${profile.name}": keep the topic, the activities and the evidence where they fit, and change the framework elements.`
					: "",
				`Apply this change to the plan and return the full updated plan: """${instruction}"""`,
				`Keep every phase of the sequence model "${profile.name}" covered. If the change asks for a different number of sessions, use that number.`,
				`List each change you made in "changes".`,
				`Current plan (JSON):\n${JSON.stringify(currentPlan)}`,
				problemsBlock(problems),
			]
				.filter(Boolean)
				.join("\n\n"),
		});
		return object;
	},

	async profileFromTemplate(text, problems) {
		const { object } = await generateObject({
			model,
			schema: profileShapeSchema,
			system: `Convert a school's lesson plan template into a lesson planning profile. The profile declares the fields the teacher must give (type text, number, enum, multi_enum or grade; enum options with value and label), the sequence models with their phases, the session columns, the assessment, the output sections in the template's order and the official text fields. Use lowercase snake_case keys. Default strategy "ask" for required or useful fields; "infer" for fields the template does not need. Only use what the template shows; do not invent official text.`,
			prompt: `Template:\n"""${text}"""${problemsBlock(problems)}`,
		});
		return object;
	},
});
