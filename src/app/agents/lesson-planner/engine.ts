import {
	ASKED_KEY,
	type Draft,
	type DraftValue,
	type LessonPlan,
	type PlanContent,
	type Profile,
	type ProfileField,
	type Question,
	type SequenceModel,
	type SequencePhase,
} from "./schema";

const MAX_QUESTIONS = 5;

export const normalizeText = (value: string) =>
	value
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.trim();

const hasValue = (value: DraftValue | undefined) => {
	if (value === undefined) return false;
	if (typeof value === "string") return value.trim().length > 0;
	if (Array.isArray(value)) return value.length > 0;
	return Number.isFinite(value);
};

const optionTerms = (field: ProfileField) =>
	(field.options ?? []).map((option) => ({
		value: option.value,
		terms: [option.value, option.label, ...option.aliases].map(normalizeText),
	}));

export type OptionMatch =
	| { status: "match"; value: string }
	| { status: "ambiguous"; values: string[] }
	| { status: "none" };

/**
 * Maps free text to one option of an enum field. Exact matches on value, label or
 * alias win; otherwise a whole-word alias inside the text counts. Anything that
 * still matches more than one option is ambiguous and must be asked.
 */
export const matchOption = (
	field: ProfileField,
	input: string,
): OptionMatch => {
	const text = normalizeText(input);
	if (!text) return { status: "none" };

	const options = optionTerms(field);
	const exact = options.filter((o) => o.terms.includes(text));
	if (exact.length === 1)
		return { status: "match", value: exact[0]?.value ?? "" };
	if (exact.length > 1)
		return { status: "ambiguous", values: exact.map((o) => o.value) };

	// A whole-word term inside the text. The longest term wins, so "tercero de
	// secundaria" picks the secundaria option over the bare "tercero" alias.
	const padded = ` ${text} `;
	const scored = options
		.map((o) => ({
			value: o.value,
			score: Math.max(
				0,
				...o.terms
					.filter((term) => term.length > 0 && padded.includes(` ${term} `))
					.map((term) => term.split(" ").length),
			),
		}))
		.filter((o) => o.score > 0);
	const best = Math.max(0, ...scored.map((o) => o.score));
	const top = scored.filter((o) => o.score === best);
	if (top.length === 1) return { status: "match", value: top[0]?.value ?? "" };
	if (top.length > 1)
		return { status: "ambiguous", values: top.map((o) => o.value) };
	return { status: "none" };
};

/** Turns one raw value into the field's type. Undefined means "could not read it". */
export const coerceValue = (
	field: ProfileField,
	raw: unknown,
): DraftValue | undefined => {
	switch (field.type) {
		case "text": {
			if (typeof raw === "number") return String(raw);
			if (typeof raw !== "string") return undefined;
			return raw.trim() || undefined;
		}
		case "number": {
			const number =
				typeof raw === "number" ? raw : Number.parseInt(String(raw), 10);
			return Number.isFinite(number) && number > 0 ? number : undefined;
		}
		case "enum":
		case "grade": {
			if (typeof raw !== "string") return undefined;
			const match = matchOption(field, raw);
			return match.status === "match" ? match.value : undefined;
		}
		case "multi_enum": {
			const parts = Array.isArray(raw)
				? raw.map(String)
				: typeof raw === "string"
					? raw.split(/,|;| y | and /i)
					: [];
			const values = parts.flatMap((part) => {
				const match = matchOption(field, part);
				return match.status === "match" ? [match.value] : [];
			});
			return values.length > 0 ? [...new Set(values)] : undefined;
		}
	}
};

/**
 * Merges structured values (`new_data` as an object) into the draft. Keys that are
 * not fields, and values that cannot be read, are reported back, not stored.
 */
export const mergeStructured = (
	profile: Profile,
	draft: Draft,
	data: Record<string, unknown>,
) => {
	const next: Draft = { ...draft };
	const rejected: string[] = [];

	for (const [key, raw] of Object.entries(data)) {
		const field = profile.fields.find((f) => f.key === key);
		if (!field) {
			rejected.push(key);
			continue;
		}
		const value = coerceValue(field, raw);
		if (value === undefined) rejected.push(key);
		else next[key] = value;
	}

	return { draft: next, rejected };
};

/** Fills `fixed:<value>` defaults for fields the draft does not have yet. */
export const applyFixedDefaults = (profile: Profile, draft: Draft): Draft => {
	const next: Draft = { ...draft };
	for (const field of profile.fields) {
		const fixed = field.default_strategy.match(/^fixed:(.+)$/)?.[1];
		if (fixed !== undefined && !hasValue(next[field.key]))
			next[field.key] = fixed;
	}
	return next;
};

/**
 * A field blocks generation when it is required, still empty and the teacher must
 * answer it. Required fields with `infer` are decided by the model and do not block.
 */
const isBlocking = (field: ProfileField, draft: Draft) =>
	field.required &&
	field.default_strategy === "ask" &&
	!hasValue(draft[field.key]);

export const blockingFields = (profile: Profile, draft: Draft) =>
	profile.fields.filter((field) => isBlocking(field, draft));

const toQuestion = (field: ProfileField): Question => ({
	field: field.key,
	question: field.help ? `${field.label} (${field.help})` : field.label,
	...(field.options?.length
		? { options: field.options.map((option) => option.label) }
		: {}),
});

/**
 * Questions for this round, at most five. Required fields come first. Optional
 * fields are asked once, and only when the teacher did not ask to decide.
 */
export const buildQuestions = (
	profile: Profile,
	draft: Draft,
	decideMissing: boolean,
): { questions: Question[]; asked: string[] } => {
	const alreadyAsked = new Set(asList(draft[ASKED_KEY]));

	const blocking = blockingFields(profile, draft)
		.filter((field) => !alreadyAsked.has(field.key) || field.required)
		.sort((a, b) => a.ask_priority - b.ask_priority)
		.slice(0, MAX_QUESTIONS);
	if (blocking.length > 0) {
		return {
			questions: blocking.map(toQuestion),
			asked: blocking.map((f) => f.key),
		};
	}

	if (decideMissing) return { questions: [], asked: [] };

	const optional = profile.fields
		.filter(
			(field) =>
				!field.required &&
				field.default_strategy === "ask" &&
				!hasValue(draft[field.key]) &&
				!alreadyAsked.has(field.key),
		)
		.sort((a, b) => a.ask_priority - b.ask_priority)
		.slice(0, MAX_QUESTIONS);

	return {
		questions: optional.map(toQuestion),
		asked: optional.map((f) => f.key),
	};
};

const asList = (value: DraftValue | undefined): string[] =>
	Array.isArray(value) ? value : [];

export const computeDerived = (
	profile: Profile,
	draft: Draft,
): Record<string, string> => {
	const derived: Record<string, string> = {};
	for (const rule of profile.derived_fields) {
		const source = draft[rule.from];
		if (typeof source !== "string") continue;
		const value = rule.map[source];
		if (value !== undefined) derived[rule.key] = value;
	}
	return derived;
};

/** The sequence model for the draft: the mapped one for its field, else the default. */
export const chooseSequenceModel = (
	profile: Profile,
	draft: Draft,
): SequenceModel => {
	const sequence = profile.default_sequence;
	const source = sequence.from ? draft[sequence.from] : undefined;
	const id =
		(typeof source === "string" ? sequence.map[source] : undefined) ??
		sequence.default;
	const model = profile.sequence_models.find((m) => m.id === id);
	if (!model) throw new Error(`Unknown sequence model "${id}"`);
	return model;
};

export type SessionGroup = { session: number; phases: SequencePhase[] };

/**
 * Splits the phases of a sequence model over the sessions. With at least as many
 * sessions as phases, every phase gets sessions (extra sessions go to the first
 * phases). With fewer, consecutive phases are grouped and the grouping is recorded.
 */
export const distributePhases = (
	phases: SequencePhase[],
	sessions: number,
): { groups: SessionGroup[]; assumptions: string[] } => {
	const count = Math.max(1, Math.floor(sessions));
	const groups: SessionGroup[] = [];

	if (count >= phases.length) {
		const base = Math.floor(count / phases.length);
		const extra = count % phases.length;
		let session = 1;
		phases.forEach((phase, index) => {
			const size = base + (index < extra ? 1 : 0);
			for (let i = 0; i < size; i++) {
				groups.push({ session, phases: [phase] });
				session++;
			}
		});
		return { groups, assumptions: [] };
	}

	const base = Math.floor(phases.length / count);
	const extra = phases.length % count;
	let cursor = 0;
	for (let session = 1; session <= count; session++) {
		const size = base + (session <= extra ? 1 : 0);
		groups.push({ session, phases: phases.slice(cursor, cursor + size) });
		cursor += size;
	}

	const grouping = groups
		.map(
			(g) =>
				`sesión ${g.session} = ${g.phases.map((p) => p.label).join(" + ")}`,
		)
		.join("; ");
	return {
		groups,
		assumptions: [
			`Las ${phases.length} fases del modelo se agruparon en ${count} sesiones: ${grouping}.`,
		],
	};
};

/** Checks what the model wrote against the skeleton. Returns problems, empty when ok. */
export const validatePlanContent = (
	content: PlanContent,
	profile: Profile,
	model: SequenceModel,
	options: { sessions?: number } = {},
): string[] => {
	const errors: string[] = [];
	const covered = new Set(content.sequence.flatMap((entry) => entry.phases));

	for (const phase of model.phases) {
		if (!covered.has(phase.key)) {
			errors.push(
				`The phase "${phase.key}" (${phase.label}) is missing from the sequence.`,
			);
		}
	}

	if (options.sessions !== undefined) {
		const numbers = content.sequence
			.map((entry) => entry.session)
			.sort((a, b) => a - b);
		const expected = Array.from({ length: options.sessions }, (_, i) => i + 1);
		if (numbers.join(",") !== expected.join(",")) {
			errors.push(
				`The sequence must have exactly sessions 1 to ${options.sessions}, once each.`,
			);
		}
	}

	const columns = profile.session_template.map((column) => column.key);
	for (const entry of content.sequence) {
		const keys = new Set(entry.columns.map((column) => column.key));
		const missing = columns.filter((key) => !keys.has(key));
		if (missing.length > 0) {
			errors.push(
				`Session ${entry.session} is missing the columns: ${missing.join(", ")}.`,
			);
		}
	}

	const { criteria_min, criteria_max } = profile.assessment;
	const criteria = content.assessment.criteria.length;
	if (criteria < criteria_min || criteria > criteria_max) {
		errors.push(
			`The assessment needs between ${criteria_min} and ${criteria_max} criteria; it has ${criteria}.`,
		);
	}

	return errors;
};

/**
 * Official text (standards, contents, PDA) comes from the teacher. When they did not
 * paste it, the model's approximation is kept but marked unverified with a warning.
 */
export const officialItems = (
	profile: Profile,
	draft: Draft,
	modelItems: PlanContent["official_items"],
) => {
	const warnings: string[] = [];
	const items = profile.official_text_fields.map((key) => {
		const field = profile.fields.find((f) => f.key === key);
		const label = field?.label ?? key;
		const supplied = draft[key];
		if (typeof supplied === "string" && supplied.trim()) {
			return { field: key, text: supplied.trim(), verified: true };
		}
		warnings.push(
			`${label}: no se proporcionó el texto oficial. Verifícalo con la fuente oficial antes de usarlo.`,
		);
		const approximation =
			modelItems.find((item) => item.field === key)?.text ?? "";
		return { field: key, text: approximation, verified: false };
	});
	return { items, warnings };
};

export const formatValue = (
	profile: Profile,
	key: string,
	value: DraftValue,
) => {
	const field = profile.fields.find((f) => f.key === key);
	if (typeof value === "number") return String(value);
	if (Array.isArray(value)) {
		return value.map((v) => optionLabel(field, v)).join(", ");
	}
	return optionLabel(field, value);
};

const optionLabel = (field: ProfileField | undefined, value: string) =>
	field?.options?.find((option) => option.value === value)?.label ?? value;

export const summarize = (
	profile: Profile,
	draft: Draft,
	derived: Record<string, string>,
	decideMissing: boolean,
) => {
	const lines = profile.fields
		.filter((field) => hasValue(draft[field.key]))
		.map(
			(field) =>
				`${field.label}: ${formatValue(profile, field.key, draft[field.key] as DraftValue)}`,
		);

	for (const rule of profile.derived_fields) {
		const value = derived[rule.key];
		if (value !== undefined) lines.push(`${rule.label}: ${value}`);
	}

	if (decideMissing) {
		for (const field of profile.fields) {
			if (!field.required && !hasValue(draft[field.key])) {
				lines.push(`${field.label}: se decidirá al generar`);
			}
		}
	}

	return lines;
};

/** Markdown from the profile's output_sections. Sections the plan does not have are skipped. */
export const renderMarkdown = (plan: LessonPlan, profile: Profile) => {
	const labels = new Map<string, string>([
		...profile.fields.map((f): [string, string] => [f.key, f.label]),
		...profile.derived_fields.map((d): [string, string] => [d.key, d.label]),
	]);
	const columnLabels = new Map(
		profile.session_template.map((c) => [c.key, c.label]),
	);
	const cell = (text: string) =>
		text.replace(/\|/g, "/").replace(/\s*\n\s*/g, " ");
	const bullets = (items: string[]) =>
		items.map((item) => `- ${item}`).join("\n");

	const blocks: string[] = [`# ${plan.title}`];

	for (const section of profile.output_sections) {
		const heading = `## ${section.label}`;
		switch (section.key) {
			case "general_info": {
				const rows = Object.entries(plan.general_info).map(
					([key, value]) =>
						`| ${cell(labels.get(key) ?? key)} | ${cell(formatValue(profile, key, value))} |`,
				);
				if (rows.length)
					blocks.push(
						[heading, "| Campo | Detalle |", "|---|---|", ...rows].join("\n"),
					);
				break;
			}
			case "purpose":
				blocks.push([heading, plan.purpose].join("\n\n"));
				break;
			case "framework_fields":
				if (plan.framework_fields.length) {
					blocks.push(
						[
							heading,
							...plan.framework_fields.map(
								(item) => `- **${item.label}:** ${item.value}`,
							),
						].join("\n"),
					);
				}
				break;
			case "official_items":
				if (plan.official_items.length) {
					blocks.push(
						[
							heading,
							...plan.official_items.map((item) => {
								const label = labels.get(item.field) ?? item.field;
								const note = item.verified
									? ""
									: " _(no verificado: revisar con la fuente oficial)_";
								return `- **${label}:** ${item.text || "—"}${note}`;
							}),
						].join("\n"),
					);
				}
				break;
			case "sequence":
				if (plan.sequence.length) {
					blocks.push(heading);
					for (const entry of [...plan.sequence].sort(
						(a, b) => a.session - b.session,
					)) {
						const parts = [`### Sesión ${entry.session} – ${entry.name}`];
						for (const column of profile.session_template) {
							const text = entry.columns.find(
								(c) => c.key === column.key,
							)?.text;
							if (text)
								parts.push(
									`**${columnLabels.get(column.key) ?? column.key}**\n\n${text}`,
								);
						}
						blocks.push(parts.join("\n\n"));
					}
				}
				break;
			case "materials":
				if (plan.materials.length) {
					blocks.push(
						[
							heading,
							...plan.materials.map((m) => `### ${m.title}\n\n${m.content}`),
						].join("\n\n"),
					);
				}
				break;
			case "final_product":
				if (plan.final_product.trim())
					blocks.push([heading, plan.final_product].join("\n\n"));
				break;
			case "resources":
				if (plan.resources.length)
					blocks.push([heading, bullets(plan.resources)].join("\n"));
				break;
			case "differentiation":
				if (plan.differentiation.length)
					blocks.push([heading, bullets(plan.differentiation)].join("\n"));
				break;
			case "assessment": {
				const { assessment } = plan;
				const rows = assessment.criteria.map(
					(c) => `| ${cell(c.criterion)} | ${cell(c.levels.join(" / "))} |`,
				);
				blocks.push(
					[
						heading,
						`**Enfoque:** ${assessment.approach} · **Instrumento:** ${assessment.instrument_type}`,
						"| Criterio | Niveles |",
						"|---|---|",
						...rows,
					].join("\n\n"),
				);
				break;
			}
			case "family_community_links":
				if (plan.family_community_links.length) {
					blocks.push(
						[heading, bullets(plan.family_community_links)].join("\n"),
					);
				}
				break;
			case "assumptions":
				if (plan.assumptions.length)
					blocks.push([heading, bullets(plan.assumptions)].join("\n"));
				break;
			case "warnings":
				if (plan.warnings.length)
					blocks.push([heading, bullets(plan.warnings)].join("\n"));
				break;
		}
	}

	return `${blocks.join("\n\n")}\n`;
};

export const messagesFor = (language: string) =>
	language.toLowerCase().startsWith("es")
		? {
				needsFramework:
					"¿Con qué marco o metodología quieres planear la clase?",
				needsInfo: "Para planear la clase necesito estos datos:",
				ready:
					"Ya tengo lo necesario. ¿Lo genero ahora o quieres ajustar algo? Puedo decidir por ti lo que falte.",
				complete: "Plan listo.",
				confirm:
					"Revisa esta plantilla. Si es la correcta, confírmala y la usamos.",
				noClassroom: "No hay un salón activo, así que el plan no se guardó.",
				decided: "no indicado; lo decido al generar",
				couldNotGenerate:
					"No pude armar el plan todavía. Para completarlo necesito que me digas:",
				templateFailed:
					"No pude leer la plantilla. Pégala de nuevo o dime qué secciones y campos tiene.",
				anythingElse: "¿Hay algo más que quieras que incluya el plan?",
				genericError:
					"Hubo un problema al planear la clase. Inténtalo de nuevo o dime qué necesitas.",
			}
		: {
				needsFramework:
					"Which framework or methodology should the lesson follow?",
				needsInfo: "To plan the lesson I need these details:",
				ready:
					"I have what I need. Should I generate it now, or adjust something? I can decide what is missing.",
				complete: "Plan ready.",
				confirm:
					"Review this template. If it is right, confirm it and I will use it.",
				noClassroom: "There is no active classroom, so the plan was not saved.",
				decided: "not given; decided when generating",
				couldNotGenerate:
					"I could not build the plan yet. To complete it, tell me:",
				templateFailed:
					"I could not read the template. Paste it again or tell me its sections and fields.",
				anythingElse: "Is there anything else the plan should include?",
				genericError:
					"There was a problem planning the lesson. Try again or tell me what you need.",
			};
