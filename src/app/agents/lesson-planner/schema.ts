import { z } from "zod";

export const ID_PATTERN = /^[a-z0-9][a-z0-9_]*$/;

const idSchema = z
	.string()
	.regex(ID_PATTERN, "use lowercase letters, digits and _");
const labelSchema = z.string().trim().min(1);

const FIELD_TYPES = ["text", "number", "enum", "multi_enum", "grade"] as const;
const OPTION_TYPES = new Set<string>(["enum", "multi_enum", "grade"]);

const optionSchema = z.object({
	value: z.string().min(1),
	label: labelSchema,
	aliases: z.array(z.string().min(1)).default([]),
});

export const fieldShapeSchema = z.object({
	key: idSchema,
	label: labelSchema,
	type: z.enum(FIELD_TYPES),
	required: z.boolean().default(false),
	options: z.array(optionSchema).optional(),
	help: z.string().optional(),
	ask_priority: z.number().int().default(100),
	default_strategy: z
		.string()
		.regex(/^(ask|infer|fixed:.+)$/, "use ask, infer or fixed:<value>")
		.default("ask"),
});

const derivedShapeSchema = z.object({
	key: idSchema,
	label: labelSchema,
	from: idSchema,
	map: z.record(z.string(), z.string()),
});

const phaseSchema = z.object({
	key: idSchema,
	label: labelSchema,
	steps: z.array(z.object({ key: idSchema, label: labelSchema })).default([]),
});

const sequenceModelShapeSchema = z.object({
	id: idSchema,
	label: labelSchema,
	phases: z.array(phaseSchema).min(1),
});

const keyLabelSchema = z.object({ key: idSchema, label: labelSchema });

const assessmentSchema = z
	.object({
		approach: z.enum(["formative", "summative", "both"]),
		instrument_types: z.array(z.string().min(1)).min(1),
		criteria_min: z.number().int().min(1),
		criteria_max: z.number().int().min(1),
	})
	.refine((value) => value.criteria_min <= value.criteria_max, {
		message: "criteria_min must be <= criteria_max",
	});

export const profileShapeSchema = z.object({
	id: idSchema,
	name: labelSchema,
	description: z.string().min(1),
	version: z.string().min(1),
	default_language: z.string().regex(/^[a-z]{2}(-[A-Z]{2})?$/, "e.g. es-MX"),
	hints: z.array(z.string().min(1)).default([]),
	fields: z.array(fieldShapeSchema).min(1),
	derived_fields: z.array(derivedShapeSchema).default([]),
	sequence_models: z.array(sequenceModelShapeSchema).min(1),
	default_sequence: z.object({
		from: idSchema.optional(),
		map: z.record(z.string(), idSchema).default({}),
		default: idSchema,
	}),
	session_template: z.array(keyLabelSchema).min(1),
	assessment: assessmentSchema,
	content_rules: z.array(z.string().min(1)).default([]),
	official_text_fields: z.array(idSchema).default([]),
	output_sections: z
		.array(z.object({ key: idSchema, label: labelSchema }))
		.min(1),
	glossary: z.array(z.string().min(1)).default([]),
});

/**
 * Profile checks that depend on other parts of the profile. Run after the shape
 * check, so a malformed file fails with one clear message.
 */
export const profileSchema = profileShapeSchema.superRefine((profile, ctx) => {
	const fail = (path: (string | number)[], message: string) =>
		ctx.addIssue({ code: z.ZodIssueCode.custom, path, message });

	const unique = (
		values: string[],
		path: (string | number)[],
		what: string,
	) => {
		if (new Set(values).size !== values.length) fail(path, `duplicate ${what}`);
	};

	unique(
		profile.fields.map((f) => f.key),
		["fields"],
		"field key",
	);
	unique(
		profile.sequence_models.map((m) => m.id),
		["sequence_models"],
		"sequence model id",
	);
	unique(
		profile.output_sections.map((s) => s.key),
		["output_sections"],
		"section key",
	);
	unique(
		profile.session_template.map((c) => c.key),
		["session_template"],
		"column key",
	);

	const fieldKeys = new Set(profile.fields.map((f) => f.key));
	const modelIds = new Set(profile.sequence_models.map((m) => m.id));

	profile.fields.forEach((field, index) => {
		if (OPTION_TYPES.has(field.type) && !field.options?.length) {
			fail(
				["fields", index, "options"],
				`${field.type} field "${field.key}" needs options`,
			);
		}
		const fixed = field.default_strategy.match(/^fixed:(.+)$/)?.[1];
		if (
			fixed !== undefined &&
			field.options &&
			!field.options.some((o) => o.value === fixed)
		) {
			fail(
				["fields", index, "default_strategy"],
				`fixed value "${fixed}" is not an option of "${field.key}"`,
			);
		}
	});

	profile.derived_fields.forEach((derived, index) => {
		if (!fieldKeys.has(derived.from)) {
			fail(
				["derived_fields", index, "from"],
				`unknown field "${derived.from}"`,
			);
		}
	});

	const sequence = profile.default_sequence;
	if (sequence.from && !fieldKeys.has(sequence.from)) {
		fail(["default_sequence", "from"], `unknown field "${sequence.from}"`);
	}
	if (!modelIds.has(sequence.default)) {
		fail(
			["default_sequence", "default"],
			`unknown sequence model "${sequence.default}"`,
		);
	}
	for (const [value, modelId] of Object.entries(sequence.map)) {
		if (!modelIds.has(modelId)) {
			fail(
				["default_sequence", "map", value],
				`unknown sequence model "${modelId}"`,
			);
		}
	}

	for (const key of profile.official_text_fields) {
		if (!fieldKeys.has(key)) {
			fail(["official_text_fields"], `unknown field "${key}"`);
		}
	}
});

export type FieldType = (typeof FIELD_TYPES)[number];
export type Profile = z.output<typeof profileSchema>;
export type ProfileField = Profile["fields"][number];
export type SequenceModel = Profile["sequence_models"][number];
export type SequencePhase = SequenceModel["phases"][number];

/** A value the teacher gave for a field. Enums hold the option value. */
export type DraftValue = string | number | string[];
export type Draft = Record<string, DraftValue>;

/** Reserved draft key: field keys already asked, so optional ones are asked once. */
export const ASKED_KEY = "_asked";

/**
 * What the model returns for a lesson plan. Plain shape (no refinements) so it can
 * be used as a structured output schema. The engine checks coverage afterwards.
 */
export const planContentSchema = z.object({
	title: z.string().min(1),
	purpose: z.string().min(1),
	framework_fields: z.array(
		z.object({ key: z.string(), label: z.string(), value: z.string() }),
	),
	sequence: z.array(
		z.object({
			session: z.number().int().min(1),
			phases: z.array(z.string()),
			name: z.string().min(1),
			columns: z.array(z.object({ key: z.string(), text: z.string() })),
		}),
	),
	materials: z.array(z.object({ title: z.string(), content: z.string() })),
	final_product: z.string(),
	resources: z.array(z.string()),
	differentiation: z.array(z.string()),
	assessment: z.object({
		approach: z.string(),
		instrument_type: z.string(),
		criteria: z.array(
			z.object({ criterion: z.string(), levels: z.array(z.string()) }),
		),
	}),
	family_community_links: z.array(z.string()),
	official_items: z.array(
		z.object({ field: z.string(), text: z.string(), verified: z.boolean() }),
	),
	assumptions: z.array(z.string()),
	warnings: z.array(z.string()),
});

export type PlanContent = z.output<typeof planContentSchema>;

export type LessonPlan = PlanContent & {
	framework_id: string;
	sequence_model_id: string;
	language: string;
	general_info: Record<string, DraftValue>;
};

export const lessonPlanSchema = planContentSchema.extend({
	framework_id: idSchema,
	sequence_model_id: idSchema,
	language: z.string().min(2),
	general_info: z.record(
		z.string(),
		z.union([z.string(), z.number(), z.array(z.string())]),
	),
});

export const draftValueSchema = z.union([
	z.string(),
	z.number(),
	z.array(z.string()),
]);

export const lessonPlannerInputSchema = z.object({
	action: z
		.enum(["list_frameworks", "update", "generate", "adjust"])
		.describe(
			"list_frameworks: show the frameworks. update: merge what the teacher said and ask what is missing. generate: build the plan from a ready draft. adjust: change current_plan.",
		),
	framework_id: z
		.string()
		.optional()
		.describe(
			"Profile id, e.g. nem_mx, ubd, 5e, pbl, direct_instruction, generic. Omit when unknown.",
		),
	custom_profile: z
		.unknown()
		.optional()
		.describe(
			"A full profile object: a school's own framework, or a profile returned as needs_confirmation after the teacher confirmed it.",
		),
	school_template_text: z
		.string()
		.max(20_000)
		.optional()
		.describe(
			"The school's own lesson plan template pasted as text. Turned into a temporary profile that the teacher must confirm.",
		),
	draft: z
		.record(z.string(), draftValueSchema)
		.optional()
		.describe(
			"Known data keyed by the profile's field keys. Pass back the draft returned by the previous call.",
		),
	new_data: z
		.union([z.string(), z.record(z.string(), z.unknown())])
		.optional()
		.describe(
			"What the teacher just said (free text), or structured values keyed by field key.",
		),
	adjust_instruction: z
		.string()
		.max(2_000)
		.optional()
		.describe(
			"For adjust: the change to make, e.g. 'shorter', 'only the rubric', 'switch framework to pbl'.",
		),
	current_plan: z
		.unknown()
		.optional()
		.describe("For adjust: the plan object returned as complete."),
	decide_missing: z
		.boolean()
		.optional()
		.describe(
			"True when the teacher says 'you decide': optional fields are filled instead of asked.",
		),
	output_language: z
		.string()
		.optional()
		.describe("Overrides the profile's default language, e.g. es-MX or en-US."),
});

export type LessonPlannerInput = z.infer<typeof lessonPlannerInputSchema>;

export type Question = {
	field: string;
	question: string;
	options?: string[];
};

export type LessonPlannerResult =
	| {
			status: "needs_framework";
			options: { id: string; name: string; description: string }[];
			message_for_teacher: string;
	  }
	| {
			status: "needs_confirmation";
			framework_id: string;
			profile: Profile;
			summary: string[];
			message_for_teacher: string;
	  }
	| {
			status: "needs_info";
			framework_id: string;
			draft: Draft;
			questions: Question[];
			message_for_teacher: string;
	  }
	| {
			status: "ready_to_generate";
			framework_id: string;
			draft: Draft;
			derived: Record<string, string>;
			summary: string[];
			message_for_teacher: string;
	  }
	| {
			status: "complete";
			framework_id: string;
			plan: LessonPlan;
			markdown: string;
			assumptions: string[];
			warnings: string[];
			changes?: string[];
			plan_artifact_id: string | null;
	  }
	| { status: "error"; message: string };
