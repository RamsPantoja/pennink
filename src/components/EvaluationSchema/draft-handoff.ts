import type { EvaluationSchemaDefinition } from "~/server/api/schemas/evaluation-schema";

/** A schema drafted in the chat, waiting for the teacher to review it in the editor. */
export type EvaluationSchemaDraft = {
	name: string;
	description: string;
	definition: EvaluationSchemaDefinition;
};

/** One-time hand-off between the chat and the schema page, scoped to this tab. */
const STORAGE_KEY = "evaluation-schema-draft";

/** Stores the draft for the schema page. Returns false when storage is unavailable. */
export function saveEvaluationSchemaDraft(
	draft: EvaluationSchemaDraft,
): boolean {
	try {
		window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
		return true;
	} catch {
		return false;
	}
}

/** Reads and clears the pending draft. Returns null when there is none or storage fails. */
export function takeEvaluationSchemaDraft(): EvaluationSchemaDraft | null {
	try {
		const raw = window.sessionStorage.getItem(STORAGE_KEY);
		if (!raw) return null;
		window.sessionStorage.removeItem(STORAGE_KEY);
		const parsed = JSON.parse(raw) as EvaluationSchemaDraft;
		return parsed?.definition?.questions ? parsed : null;
	} catch {
		return null;
	}
}
