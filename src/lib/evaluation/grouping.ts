export type IncomingFile = {
	name: string;
	/** Path inside the zip, such as `exam-03/juan-perez/page-01.png`. */
	path: string;
};

export type GroupedPage = { file: IncomingFile; pageNo: number };

export type StudentGroup = {
	studentName: string;
	pages: GroupedPage[];
};

export type UnassignedFile = { file: IncomingFile; reason: string };

export type GroupingResult = {
	students: StudentGroup[];
	unassigned: UnassignedFile[];
};

const PAGE_NUMBER = /(\d+)\.(?:png|jpe?g)$/i;
const NOT_IN_STUDENT_FOLDER = "Put the file in a student folder inside the zip";

/** "juan-perez" and "juan_perez" become "Juan Perez". */
export function studentNameFromSlug(slug: string) {
	return slug
		.replace(/[-_]+/g, " ")
		.trim()
		.split(/\s+/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

/**
 * Groups zip entries by student. A page belongs to the folder directly above it, so a wrapper
 * folder at the top of the zip is fine. The number in the file name sets the page order.
 * Pages are renumbered 1..n, so duplicate numbers do not collide.
 */
export function groupFilesByStudent(files: IncomingFile[]): GroupingResult {
	const groups = new Map<string, GroupedPage[]>();
	const unassigned: UnassignedFile[] = [];

	for (const file of files) {
		const segments = file.path.split("/").filter(Boolean);
		const folder =
			segments.length >= 2 ? segments[segments.length - 2] : undefined;
		if (!folder) {
			unassigned.push({ file, reason: NOT_IN_STUDENT_FOLDER });
			continue;
		}

		const studentName = studentNameFromSlug(folder);
		const pageNo =
			Number(PAGE_NUMBER.exec(file.name)?.[1]) || Number.MAX_SAFE_INTEGER;
		const pages = groups.get(studentName) ?? [];
		pages.push({ file, pageNo });
		groups.set(studentName, pages);
	}

	const students = [...groups.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([studentName, pages]) => ({
			studentName,
			pages: pages
				.sort(
					(a, b) =>
						a.pageNo - b.pageNo || a.file.name.localeCompare(b.file.name),
				)
				.map((page, index) => ({ ...page, pageNo: index + 1 })),
		}));

	return { students, unassigned };
}
