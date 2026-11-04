import type { EvaluationAnswer } from "~/server/api/schemas/evaluation-run";

export type CsvSubmission = {
	studentName: string;
	status: string;
	score: number | null;
	answers: Record<string, EvaluationAnswer> | null;
};

/** RFC 4180 quoting: wrap in quotes when needed and double any quote characters. */
export function escapeCsvCell(value: string | number | null | undefined) {
	if (value === null || value === undefined) return "";
	const text = String(value);
	return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** One cell per question: the score, otherwise the chosen label or the box. */
function answerCell(answer: EvaluationAnswer | undefined) {
	if (!answer) return "";
	const value = answer.override ?? answer.score;
	if (value !== null) return value;
	if (answer.label) return answer.label;
	if (answer.box) {
		const { top, bottom, left, right } = answer.box;
		return `box(${top},${left})-(${bottom},${right})`;
	}
	return "";
}

export function buildRunCsv(
	questionKeys: string[],
	submissions: CsvSubmission[],
) {
	const header = ["Student", "Status", "Total", ...questionKeys, "Flagged"];
	const rows = submissions.map((submission) => {
		const answers = submission.answers ?? {};
		const flagged = Object.values(answers).filter(
			(answer) => answer.flagged && answer.override === undefined,
		).length;
		return [
			submission.studentName,
			submission.status,
			submission.score,
			...questionKeys.map((key) => answerCell(answers[key])),
			flagged,
		];
	});

	return [header, ...rows]
		.map((row) => row.map((cell) => escapeCsvCell(cell)).join(","))
		.join("\r\n");
}
