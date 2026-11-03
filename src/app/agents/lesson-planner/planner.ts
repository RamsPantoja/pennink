import {
	applyFixedDefaults,
	buildQuestions,
	chooseSequenceModel,
	computeDerived,
	distributePhases,
	messagesFor,
	mergeStructured,
	officialItems,
	renderMarkdown,
	summarize,
	validatePlanContent,
	formatValue,
} from "./engine";
import type { LlmClient } from "./llm";
import {
	findProfile,
	matchHints,
	ProfileError,
	parseProfile,
} from "./registry";
import {
	ASKED_KEY,
	lessonPlanSchema,
	type Draft,
	type DraftValue,
	type LessonPlan,
	type LessonPlannerInput,
	type LessonPlannerResult,
	type PlanContent,
	type Profile,
	type SequenceModel,
} from "./schema";

export type PlannerDeps = {
	profiles: Profile[];
	llm: LlmClient;
	/** Saves the Markdown as a lesson plan. Absent when there is no active classroom. */
	savePlan?: (input: { title: string; content: string }) => Promise<string>;
};

const MAX_ATTEMPTS = 2;

const messageOf = (error: unknown) =>
	error instanceof Error ? error.message : String(error);

const sessionsOf = (draft: Draft) => {
	const value = draft.sessions;
	return typeof value === "number" && value >= 1 ? Math.floor(value) : 1;
};

/**
 * Runs the model until its output passes the check, at most MAX_ATTEMPTS times. Each
 * retry gets the problems of the previous answer. Returns the problems if it never passes.
 */
const generateValid = async <T>(
	run: (problems: string[]) => Promise<T>,
	check: (value: T) => string[],
): Promise<{ value: T } | { problems: string[] }> => {
	let problems: string[] = [];
	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		try {
			const value = await run(problems);
			problems = check(value);
			if (problems.length === 0) return { value };
		} catch (error) {
			problems = [
				`The previous answer was not valid output: ${messageOf(error)}`,
			];
		}
	}
	return { problems };
};

const optionsOf = (profiles: Profile[]) =>
	profiles.map((profile) => ({
		id: profile.id,
		name: profile.name,
		description: profile.description,
	}));

const needsFramework = (
	profiles: Profile[],
	language: string,
): LessonPlannerResult => ({
	status: "needs_framework",
	options: optionsOf(profiles),
	message_for_teacher: `${messagesFor(language).needsFramework} ${profiles
		.map((p) => `${p.name} (${p.id})`)
		.join("; ")}.`,
});

/**
 * Which profile to use: a custom profile in the call, the framework_id, the profile of
 * the current plan (adjust), or one the teacher clearly named. Undefined when unclear.
 */
const resolveProfile = (
	input: LessonPlannerInput,
	deps: PlannerDeps,
	currentFrameworkId?: string,
): Profile | undefined => {
	if (input.custom_profile !== undefined) {
		return parseProfile(input.custom_profile, "custom_profile");
	}

	const id = input.framework_id ?? currentFrameworkId;
	if (id) {
		const profile = findProfile(deps.profiles, id);
		if (!profile) throw new ProfileError(`Unknown framework "${id}"`);
		return profile;
	}

	if (typeof input.new_data === "string") {
		const matches = matchHints(deps.profiles, input.new_data);
		if (matches.length === 1) return matches[0];
	}
	return undefined;
};

const languageFor = (input: LessonPlannerInput, profile?: Profile) =>
	input.output_language ?? profile?.default_language ?? "es-MX";

/** Extracts or merges the teacher's new data into the draft. */
const applyNewData = async (
	profile: Profile,
	draft: Draft,
	newData: LessonPlannerInput["new_data"],
	llm: LlmClient,
): Promise<Draft> => {
	if (typeof newData === "string") {
		if (!newData.trim()) return draft;
		try {
			const extracted = await llm.extractFields({
				profile,
				text: newData,
				draft,
			});
			return mergeStructured(profile, draft, extracted).draft;
		} catch (error) {
			// Not fatal: the draft is kept and the update asks for what is still missing.
			console.warn(
				"[lesson-planner] field extraction failed",
				messageOf(error),
			);
			return draft;
		}
	}
	if (newData) return mergeStructured(profile, draft, newData).draft;
	return draft;
};

const withAsked = (draft: Draft, keys: string[]): Draft => {
	const previous = draft[ASKED_KEY];
	const asked = [...(Array.isArray(previous) ? previous : []), ...keys];
	return { ...draft, [ASKED_KEY]: [...new Set(asked)] };
};

const needsInfoResult = (
	profile: Profile,
	frameworkId: string,
	draft: Draft,
	decideMissing: boolean,
): LessonPlannerResult | undefined => {
	const { questions, asked } = buildQuestions(profile, draft, decideMissing);
	if (questions.length === 0) return undefined;

	return {
		status: "needs_info",
		framework_id: frameworkId,
		draft: withAsked(draft, asked),
		questions,
		message_for_teacher: messagesFor(profile.default_language).needsInfo,
	};
};

const update = async (
	input: LessonPlannerInput,
	profile: Profile,
	deps: PlannerDeps,
): Promise<LessonPlannerResult> => {
	const decideMissing = input.decide_missing ?? false;
	let draft = await applyNewData(
		profile,
		{ ...input.draft },
		input.new_data,
		deps.llm,
	);
	draft = applyFixedDefaults(profile, draft);

	const asking = needsInfoResult(profile, profile.id, draft, decideMissing);
	if (asking) return asking;

	const derived = computeDerived(profile, draft);
	return {
		status: "ready_to_generate",
		framework_id: profile.id,
		draft,
		derived,
		summary: summarize(profile, draft, derived, decideMissing),
		message_for_teacher: messagesFor(languageFor(input, profile)).ready,
	};
};

/** Optional fields the teacher left open and the model decides, recorded as assumptions. */
const decidedFields = (profile: Profile, draft: Draft, language: string) => {
	const messages = messagesFor(language);
	return profile.fields
		.filter((field) => !field.required && draft[field.key] === undefined)
		.map((field) => `${field.label}: ${messages.decided}`);
};

const pickGeneralInfo = (
	profile: Profile,
	draft: Draft,
	derived: Record<string, string>,
) => {
	const general: Record<string, DraftValue> = {};
	for (const field of profile.fields) {
		const value = draft[field.key];
		if (value !== undefined) general[field.key] = value;
	}
	return { ...general, ...derived };
};

const buildPlan = ({
	profile,
	model,
	content,
	general,
	derived,
	language,
	assumptions,
}: {
	profile: Profile;
	model: SequenceModel;
	content: PlanContent;
	general: Draft;
	derived: Record<string, string>;
	language: string;
	assumptions: string[];
}): LessonPlan => {
	const official = officialItems(profile, general, content.official_items);
	return {
		...content,
		sequence: [...content.sequence].sort((a, b) => a.session - b.session),
		official_items: official.items,
		framework_id: profile.id,
		sequence_model_id: model.id,
		language,
		general_info: pickGeneralInfo(profile, general, derived),
		assumptions: [...assumptions, ...content.assumptions],
		warnings: [...official.warnings, ...content.warnings],
	};
};

const complete = async (
	plan: LessonPlan,
	profile: Profile,
	deps: PlannerDeps,
	changes?: string[],
): Promise<LessonPlannerResult> => {
	const messages = messagesFor(plan.language);
	if (!deps.savePlan) plan.warnings = [...plan.warnings, messages.noClassroom];

	const markdown = renderMarkdown(plan, profile);
	const planArtifactId = deps.savePlan
		? await deps.savePlan({ title: plan.title, content: markdown })
		: null;

	return {
		status: "complete",
		framework_id: profile.id,
		plan,
		markdown,
		assumptions: plan.assumptions,
		warnings: plan.warnings,
		...(changes ? { changes } : {}),
		plan_artifact_id: planArtifactId,
	};
};

const generate = async (
	input: LessonPlannerInput,
	profile: Profile,
	deps: PlannerDeps,
): Promise<LessonPlannerResult> => {
	const decideMissing = input.decide_missing ?? false;
	const draft = applyFixedDefaults(profile, { ...input.draft });

	const asking = needsInfoResult(profile, profile.id, draft, true);
	if (asking) return asking;

	const language = languageFor(input, profile);
	const model = chooseSequenceModel(profile, draft);
	const sessions = sessionsOf(draft);
	const { groups, assumptions: grouping } = distributePhases(
		model.phases,
		sessions,
	);
	const derived = computeDerived(profile, draft);
	const assumptions = [
		...grouping,
		...(decideMissing ? decidedFields(profile, draft, language) : []),
	];

	const result = await generateValid<PlanContent>(
		(problems) =>
			deps.llm.generatePlan({
				profile,
				draft,
				derived,
				model,
				groups,
				language,
				problems,
			}),
		(content) => validatePlanContent(content, profile, model, { sessions }),
	);
	if ("problems" in result)
		return failed(profile, draft, language, result.problems);

	const plan = buildPlan({
		profile,
		model,
		content: result.value,
		general: draft,
		derived,
		language,
		assumptions,
	});
	return complete(plan, profile, deps);
};

/** Fields that make a plan better when the model could not use what it had. */
const HELPFUL_KEYS = [
	"objective",
	"objectives",
	"minutes_per_session",
	"resources",
	"student_needs",
];

/**
 * The model could not produce a plan. The teacher gets a question about the details the
 * plan still needs, not the technical reason (kept in the log).
 */
const failed = (
	profile: Profile,
	draft: Draft,
	language: string,
	problems: string[],
): LessonPlannerResult => {
	console.warn("[lesson-planner] generation failed", problems);
	const messages = messagesFor(language);

	const { questions, asked } = buildQuestions(profile, draft, false);
	const helpful = profile.fields
		.filter((f) => HELPFUL_KEYS.includes(f.key) && !hasAnswer(draft[f.key]))
		.map((f) => ({ field: f.key, question: f.label }));
	const fallback =
		helpful.length > 0
			? helpful.slice(0, 5)
			: [{ field: "details", question: messages.anythingElse }];

	return {
		status: "needs_info",
		framework_id: profile.id,
		draft: withAsked(draft, asked),
		questions: questions.length > 0 ? questions : fallback,
		message_for_teacher: messages.couldNotGenerate,
	};
};

const hasAnswer = (value: DraftValue | undefined) =>
	value !== undefined &&
	(typeof value !== "string" || value.trim().length > 0) &&
	(!Array.isArray(value) || value.length > 0);

/** Draft for a new framework, from the values of the current plan. */
const remapDraft = (
	plan: LessonPlan,
	previous: Profile | undefined,
	profile: Profile,
): Draft => {
	const raw: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(plan.general_info)) {
		const oldField = previous?.fields.find((f) => f.key === key);
		raw[key] =
			oldField && previous
				? formatValue(previous, key, value)
				: Array.isArray(value)
					? value.join(", ")
					: value;
	}
	return mergeStructured(profile, {}, raw).draft;
};

const adjust = async (
	input: LessonPlannerInput,
	deps: PlannerDeps,
): Promise<LessonPlannerResult> => {
	if (input.current_plan === undefined) {
		return {
			status: "error",
			message: "adjust needs current_plan, the plan returned as complete.",
		};
	}
	if (!input.adjust_instruction?.trim()) {
		return { status: "error", message: "adjust needs adjust_instruction." };
	}

	const parsed = lessonPlanSchema.safeParse(input.current_plan);
	if (!parsed.success) {
		return {
			status: "error",
			message: "current_plan is not a plan returned by this tool.",
		};
	}
	const current = parsed.data;
	const previous = findProfile(deps.profiles, current.framework_id);
	const profile = resolveProfile(input, deps, current.framework_id);
	if (!profile)
		return needsFramework(deps.profiles, languageFor(input, previous));

	const language = languageFor(input, profile);
	const instruction = input.adjust_instruction.trim();

	if (profile.id !== current.framework_id) {
		const draft = applyFixedDefaults(profile, {
			...remapDraft(current, previous, profile),
			...input.draft,
		});
		const asking = needsInfoResult(profile, profile.id, draft, true);
		if (asking) return asking;

		const model = chooseSequenceModel(profile, draft);
		const derived = computeDerived(profile, draft);
		const result = await generateValid<PlanContent & { changes: string[] }>(
			(problems) =>
				deps.llm.adjustPlan({
					profile,
					currentPlan: current,
					instruction,
					language,
					remapFrom: previous?.name ?? current.framework_id,
					problems,
				}),
			(content) => validatePlanContent(content, profile, model),
		);
		if ("problems" in result)
			return failed(profile, draft, language, result.problems);

		const { changes, ...content } = result.value;
		const plan = buildPlan({
			profile,
			model,
			content,
			general: draft,
			derived,
			language,
			assumptions: [
				`Plan re-mapeado de "${previous?.name ?? current.framework_id}" a "${profile.name}".`,
			],
		});
		return complete(plan, profile, deps, changes);
	}

	const model =
		profile.sequence_models.find((m) => m.id === current.sequence_model_id) ??
		chooseSequenceModel(profile, current.general_info as Draft);
	const general = current.general_info as Draft;
	const derived = computeDerived(profile, general);

	const result = await generateValid<PlanContent & { changes: string[] }>(
		(problems) =>
			deps.llm.adjustPlan({
				profile,
				currentPlan: current,
				instruction,
				language,
				problems,
			}),
		(content) => validatePlanContent(content, profile, model),
	);
	if ("problems" in result)
		return failed(profile, general, language, result.problems);

	const { changes, ...content } = result.value;
	const plan = buildPlan({
		profile,
		model,
		content,
		general,
		derived,
		language,
		assumptions: [],
	});
	return complete(plan, profile, deps, changes);
};

const templateProfile = async (
	text: string,
	deps: PlannerDeps,
	language: string,
): Promise<LessonPlannerResult> => {
	const result = await generateValid<Profile>(
		async (problems) =>
			parseProfile(
				await deps.llm.profileFromTemplate(text, problems),
				"school template",
			),
		() => [],
	);
	if ("problems" in result) {
		console.warn("[lesson-planner] template failed", result.problems);
		return {
			status: "error",
			message: messagesFor(language).templateFailed,
		};
	}

	const profile = result.value;
	return {
		status: "needs_confirmation",
		framework_id: profile.id,
		profile,
		summary: [
			`${profile.name}`,
			`Campos: ${profile.fields.map((f) => f.label).join(", ")}`,
			`Secuencia: ${profile.sequence_models.map((m) => m.label).join("; ")}`,
			`Secciones: ${profile.output_sections.map((s) => s.label).join(", ")}`,
		],
		message_for_teacher: messagesFor(language).confirm,
	};
};

/** Runs one lesson planner action. Errors come back as status "error", never thrown. */
export const runLessonPlanner = async (
	input: LessonPlannerInput,
	deps: PlannerDeps,
): Promise<LessonPlannerResult> => {
	try {
		if (input.action === "adjust") return await adjust(input, deps);

		if (input.action === "list_frameworks") {
			return needsFramework(deps.profiles, languageFor(input));
		}

		if (input.school_template_text && input.custom_profile === undefined) {
			return await templateProfile(
				input.school_template_text,
				deps,
				languageFor(input),
			);
		}

		const profile = resolveProfile(input, deps);
		if (!profile) return needsFramework(deps.profiles, languageFor(input));

		if (input.action === "generate")
			return await generate(input, profile, deps);
		return await update(input, profile, deps);
	} catch (error) {
		// Our own profile errors name the problem; anything else is logged and kept out of the reply.
		if (error instanceof ProfileError) {
			return { status: "error", message: error.message };
		}
		console.error("[lesson-planner] unexpected error", error);
		return {
			status: "error",
			message: messagesFor(languageFor(input)).genericError,
		};
	}
};
