import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { normalizeText } from "./engine";
import { profileSchema, type Profile } from "./schema";
import directInstruction from "./profiles/direct_instruction.json";
import fiveE from "./profiles/5e.json";
import generic from "./profiles/generic.json";
import nemMx from "./profiles/nem_mx.json";
import pbl from "./profiles/pbl.json";
import ubd from "./profiles/ubd.json";

/** Built-in profiles. A new built-in is one JSON file and one line here. */
const BUILT_IN: unknown[] = [
	nemMx,
	ubd,
	fiveE,
	pbl,
	directInstruction,
	generic,
];

export const CUSTOM_PROFILES_DIR =
	process.env.LESSON_PROFILES_DIR ??
	path.join(process.cwd(), "config", "lesson-profiles");

export class ProfileError extends Error {
	override name = "ProfileError";
}

const formatIssues = (
	issues: { path: (string | number)[]; message: string }[],
) =>
	issues
		.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
		.join("; ");

/** Validates a profile object. Throws a ProfileError that names the source. */
export const parseProfile = (raw: unknown, source: string): Profile => {
	const result = profileSchema.safeParse(raw);
	if (!result.success) {
		throw new ProfileError(
			`Invalid lesson profile (${source}): ${formatIssues(result.error.issues)}`,
		);
	}
	return result.data;
};

const builtInProfiles = BUILT_IN.map((raw, index) =>
	parseProfile(raw, `built-in #${index + 1}`),
);

/** Loads every *.json file in the config folder. A missing folder means no custom profiles. */
export const loadCustomProfiles = (
	dir: string = CUSTOM_PROFILES_DIR,
): Profile[] => {
	if (!existsSync(dir)) return [];

	return readdirSync(dir)
		.filter((file) => file.endsWith(".json"))
		.sort()
		.map((file) => {
			let raw: unknown;
			try {
				raw = JSON.parse(readFileSync(path.join(dir, file), "utf8"));
			} catch {
				throw new ProfileError(
					`Invalid lesson profile (${file}): the file is not valid JSON`,
				);
			}
			return parseProfile(raw, file);
		});
};

/** Built-in and custom profiles, with ids that must be unique. */
export const loadProfiles = (dir?: string): Profile[] => {
	const all = [...builtInProfiles, ...loadCustomProfiles(dir)];
	const seen = new Set<string>();
	for (const profile of all) {
		if (seen.has(profile.id)) {
			throw new ProfileError(`Duplicate lesson profile id "${profile.id}"`);
		}
		seen.add(profile.id);
	}
	return all;
};

export const findProfile = (profiles: Profile[], id: string) =>
	profiles.find((profile) => profile.id === id);

/**
 * Profiles whose hints appear as whole words in the text. Used to infer the framework
 * when the teacher names it ("NEM", "planeación por campos formativos").
 */
export const matchHints = (profiles: Profile[], text: string) => {
	const padded = ` ${normalizeText(text)} `;
	return profiles.filter(
		(profile) =>
			profile.id !== "generic" &&
			profile.hints.some((hint) => {
				const term = normalizeText(hint);
				return term.length > 0 && padded.includes(` ${term} `);
			}),
	);
};
