import { describe, expect, it } from "vitest";
import {
	chooseSequenceModel,
	distributePhases,
	matchOption,
	renderMarkdown,
	validatePlanContent,
} from "../engine";
import type { LessonPlan } from "../schema";
import {
	contentFor,
	fieldOf,
	groupsFor,
	modelAt,
	profileById,
} from "./helpers";

const nem = profileById("nem_mx");
const grade = fieldOf(nem, "grade");
const campo = fieldOf(nem, "campo_formativo");

describe("matchOption", () => {
	it("maps ordinals and aliases to the grade value", () => {
		expect(matchOption(grade, "cuarto")).toEqual({
			status: "match",
			value: "4_primaria",
		});
		expect(matchOption(grade, "4° primaria")).toEqual({
			status: "match",
			value: "4_primaria",
		});
		expect(matchOption(grade, "tercero de secundaria")).toEqual({
			status: "match",
			value: "3_secundaria",
		});
	});

	it("maps a campo formativo named inside a sentence", () => {
		expect(matchOption(campo, "quiero trabajar saberes")).toEqual({
			status: "match",
			value: "saberes_pensamiento_cientifico",
		});
	});

	it("reports no match for text that names no option", () => {
		expect(matchOption(campo, "fracciones")).toEqual({ status: "none" });
	});
});

describe("distributePhases", () => {
	const phases = modelAt(nem, 1).phases;

	it("gives every phase at least one session when there are enough sessions", () => {
		const { groups, assumptions } = distributePhases(phases, 8);
		expect(groups).toHaveLength(8);
		expect(
			new Set(groups.flatMap((g) => g.phases.map((p) => p.key))).size,
		).toBe(phases.length);
		expect(assumptions).toEqual([]);
	});

	it("groups consecutive phases and records the grouping when sessions are fewer", () => {
		const fiveE = profileById("5e");
		const { groups, assumptions } = distributePhases(
			modelAt(fiveE, 0).phases,
			3,
		);
		expect(groups.map((g) => g.phases.map((p) => p.key))).toEqual([
			["engage", "explore"],
			["explain", "elaborate"],
			["evaluate"],
		]);
		expect(assumptions[0]).toContain("3 sesiones");
	});
});

describe("chooseSequenceModel", () => {
	it("uses the model mapped from the campo formativo", () => {
		const model = chooseSequenceModel(nem, {
			campo_formativo: "etica_naturaleza_sociedades",
		});
		expect(model.id).toBe("aprendizaje_basado_en_problemas");
	});

	it("falls back to the default model", () => {
		expect(chooseSequenceModel(nem, {}).id).toBe("proyectos_comunitarios");
	});
});

describe("validatePlanContent", () => {
	it("reports phases, session numbers, columns and criteria that do not match", () => {
		const fiveE = profileById("5e");
		const content = contentFor(fiveE, groupsFor(fiveE, 5));
		content.sequence = content.sequence.slice(0, 4);
		const first = content.sequence[0];
		if (first) first.columns = first.columns.slice(1);
		content.assessment.criteria = [];

		const problems = validatePlanContent(content, fiveE, modelAt(fiveE, 0), {
			sessions: 5,
		});

		expect(problems).toEqual(
			expect.arrayContaining([
				expect.stringContaining('"evaluate"'),
				expect.stringContaining("exactly sessions 1 to 5"),
				expect.stringContaining("missing the columns"),
				expect.stringContaining("between 3 and 5 criteria"),
			]),
		);
	});

	it("accepts a complete plan", () => {
		const fiveE = profileById("5e");
		const groups = groupsFor(fiveE, 3);
		expect(
			validatePlanContent(contentFor(fiveE, groups), fiveE, modelAt(fiveE, 0), {
				sessions: 3,
			}),
		).toEqual([]);
	});
});

describe("renderMarkdown", () => {
	it("renders the profile's sections in order, with the derived fase in the general data", () => {
		const groups = groupsFor(nem, 2);
		const content = contentFor(nem, groups);
		const plan: LessonPlan = {
			...content,
			framework_id: nem.id,
			sequence_model_id: "proyectos_comunitarios",
			language: "es-MX",
			general_info: { grade: "4_primaria", sessions: 2, fase: "4" },
			official_items: [{ field: "contenidos", text: "", verified: false }],
			assumptions: ["Supuesto de prueba"],
			warnings: [],
		};

		const markdown = renderMarkdown(plan, nem);

		expect(markdown.startsWith("# Plan de Nueva Escuela")).toBe(true);
		expect(markdown).toContain("| Fase | 4 |");
		expect(markdown).toContain("| Grado o nivel | 4° de primaria |");
		expect(markdown.indexOf("## Datos generales")).toBeLessThan(
			markdown.indexOf("## Secuencia didáctica"),
		);
		expect(markdown).toContain("### Sesión 1 – Sesión 1");
		expect(markdown).toContain("_(no verificado");
	});
});
