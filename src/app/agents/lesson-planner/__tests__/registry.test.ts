import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import fiveERaw from "../profiles/5e.json";
import { loadCustomProfiles, loadProfiles, ProfileError } from "../registry";
import { profileById } from "./helpers";

const folder = () => mkdtempSync(join(tmpdir(), "lesson-profiles-"));

describe("profile registry", () => {
	it("loads the built-in profiles", () => {
		const ids = loadProfiles(
			join(tmpdir(), "lesson-planner-test-no-custom"),
		).map((p) => p.id);
		expect(ids).toEqual(
			expect.arrayContaining([
				"nem_mx",
				"ubd",
				"5e",
				"pbl",
				"direct_instruction",
				"generic",
			]),
		);
		expect(profileById("nem_mx").default_language).toBe("es-MX");
	});

	it("picks up a new profile file from the config folder with no code changes", () => {
		const dir = folder();
		writeFileSync(
			join(dir, "mi_escuela.json"),
			JSON.stringify({ ...fiveERaw, id: "mi_escuela", name: "Mi escuela" }),
		);

		const ids = loadProfiles(dir).map((p) => p.id);

		expect(ids).toContain("mi_escuela");
	});

	it("names the file and the path of a malformed profile", () => {
		const dir = folder();
		writeFileSync(
			join(dir, "bad.json"),
			JSON.stringify({
				...fiveERaw,
				id: "bad",
				default_sequence: { default: "nope", map: {} },
			}),
		);

		expect(() => loadCustomProfiles(dir)).toThrow(ProfileError);
		expect(() => loadCustomProfiles(dir)).toThrow(
			/Invalid lesson profile \(bad\.json\).*unknown sequence model "nope"/,
		);
	});

	it("rejects a profile id that is already used", () => {
		const dir = folder();
		writeFileSync(
			join(dir, "copy.json"),
			JSON.stringify({ ...fiveERaw, id: "nem_mx", name: "Copia" }),
		);

		expect(() => loadProfiles(dir)).toThrow(
			/Duplicate lesson profile id "nem_mx"/,
		);
	});

	it("ignores a folder that does not exist", () => {
		expect(
			loadCustomProfiles(join(tmpdir(), "lesson-planner-missing-folder")),
		).toEqual([]);
	});

	it("reads only json files from the folder", () => {
		const dir = folder();
		mkdirSync(join(dir, "nested"));
		writeFileSync(join(dir, "notes.txt"), "not a profile");

		expect(loadCustomProfiles(dir)).toEqual([]);
	});
});
