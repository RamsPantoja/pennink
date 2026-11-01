export type PlanArtifactRange = "day" | "week";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const pad = (value: number) => String(value).padStart(2, "0");

const formatUtc = (date: Date) =>
	`${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

export const toIsoDate = (date: Date) =>
	`${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseIsoDate = (value: string) => {
	if (!ISO_DATE.test(value)) {
		throw new Error(`Invalid date "${value}", expected YYYY-MM-DD`);
	}
	const [year = Number.NaN, month = Number.NaN, day = Number.NaN] = value
		.split("-")
		.map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	if (formatUtc(date) !== value) {
		throw new Error(`Invalid date "${value}", expected YYYY-MM-DD`);
	}
	return date;
};

/**
 * Inclusive ISO date bounds for a plan. A week runs Monday to Sunday and contains
 * `date`. Arithmetic is done in UTC so the result does not depend on the server's
 * timezone.
 */
export function resolveRange({
	range,
	date,
}: {
	range: PlanArtifactRange;
	date?: string;
}) {
	const anchor = parseIsoDate(date ?? toIsoDate(new Date()));

	if (range === "day") {
		const day = formatUtc(anchor);
		return { startDate: day, endDate: day };
	}

	const mondayOffset = (anchor.getUTCDay() + 6) % 7;
	const start = new Date(anchor);
	start.setUTCDate(anchor.getUTCDate() - mondayOffset);
	const end = new Date(start);
	end.setUTCDate(start.getUTCDate() + 6);

	return { startDate: formatUtc(start), endDate: formatUtc(end) };
}
