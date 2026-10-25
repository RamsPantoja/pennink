export type StudyPlanMeta = {
	title: string;
	description: string;
	classrooms: string[];
};

export type StudyPlanItem = {
	position: number;
	parentPosition: number | null;
	title: string;
	dueDate: string | null;
	completed: boolean;
};

export type ParsedStudyPlan = {
	meta: StudyPlanMeta;
	body: string;
	items: StudyPlanItem[];
};

const FRONTMATTER_DELIMITER = "---";
const CHECKBOX_PATTERN = /^(\s*)- \[( |x|X)\] (?:(\d{4}-\d{2}-\d{2}) )?(.+)$/;
const HEADING_PATTERN = /^#{1,6}\s/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function unquote(value: string) {
	return value.replace(/^["']|["']$/g, "").trim();
}

function parseList(value: string) {
	const inner = value.trim().replace(/^\[|\]$/g, "");
	return inner
		.split(",")
		.map((item) => unquote(item))
		.filter(Boolean);
}

function isValidIsoDate(value: string) {
	if (!ISO_DATE_PATTERN.test(value)) return false;
	const date = new Date(`${value}T00:00:00Z`);
	return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function splitFrontmatter(markdown: string) {
	const lines = markdown.split(/\r?\n/);
	if (lines[0]?.trim() !== FRONTMATTER_DELIMITER) {
		return { frontmatter: [] as string[], body: markdown };
	}

	const end = lines.findIndex(
		(line, index) => index > 0 && line.trim() === FRONTMATTER_DELIMITER,
	);
	if (end === -1) return { frontmatter: [] as string[], body: markdown };

	return {
		frontmatter: lines.slice(1, end),
		body: lines.slice(end + 1).join("\n"),
	};
}

export function parseStudyPlan(markdown: string): ParsedStudyPlan {
	const { frontmatter, body } = splitFrontmatter(markdown);

	const meta: StudyPlanMeta = {
		title: "",
		description: "",
		classrooms: [],
	};

	for (const line of frontmatter) {
		const separator = line.indexOf(":");
		if (separator === -1) continue;

		const key = line.slice(0, separator).trim();
		const value = line.slice(separator + 1).trim();

		if (key === "title") meta.title = unquote(value);
		if (key === "description") meta.description = unquote(value);
		if (key === "classrooms") meta.classrooms = parseList(value);
	}

	const items: StudyPlanItem[] = [];
	// Only one level of sub-topics: an indented checkbox nests under the last
	// top-level checkbox, and anything indented deeper joins that same parent.
	let parentPosition: number | null = null;
	for (const line of body.split(/\r?\n/)) {
		if (HEADING_PATTERN.test(line)) {
			parentPosition = null;
			continue;
		}

		const match = CHECKBOX_PATTERN.exec(line);
		if (!match) continue;

		const indent = match[1] ?? "";
		const mark = match[2] ?? " ";
		const date = match[3];
		const position = items.length;
		const isSubItem = indent.length > 0 && parentPosition !== null;

		items.push({
			position,
			parentPosition: isSubItem ? parentPosition : null,
			title: (match[4] ?? "").trim(),
			dueDate: date && isValidIsoDate(date) ? date : null,
			completed: mark.toLowerCase() === "x",
		});

		if (!isSubItem) parentPosition = position;
	}

	return { meta, body, items };
}

export function buildStudyPlanMarkdown(meta: StudyPlanMeta, body: string) {
	const frontmatter = [
		FRONTMATTER_DELIMITER,
		`title: ${meta.title}`,
		`description: ${meta.description}`,
		`classrooms: [${meta.classrooms.join(", ")}]`,
		FRONTMATTER_DELIMITER,
	];

	return `${frontmatter.join("\n")}\n${body.replace(/^\n+/, "")}`;
}

/**
 * Writes `[x]` / `[ ]` marks onto the checkbox lines of a body, using the
 * completion state of one classroom. `completed[position]` is that item's state;
 * the rest of each line is left as it is.
 */
export function applyCompletionMarks(body: string, completed: boolean[]) {
	let seen = -1;

	return body
		.split(/\r?\n/)
		.map((line) => {
			const match = CHECKBOX_PATTERN.exec(line);
			if (!match) return line;

			seen++;
			const indent = match[1] ?? "";
			const date = match[3];
			const title = match[4] ?? "";
			const mark = completed[seen] ? "x" : " ";
			const datePart = date ? `${date} ` : "";
			return `${indent}- [${mark}] ${datePart}${title}`;
		})
		.join("\n");
}
