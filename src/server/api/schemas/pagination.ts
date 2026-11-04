import { z } from "zod";

export const MAX_PAGE_SIZE = 50;
export const DEFAULT_PAGE_SIZE = 12;

export const pageInputSchema = z.object({
	page: z.number().int().min(1).default(1),
	pageSize: z.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

/** Title search. Blank input means no filter. */
export const searchSchema = z.string().trim().max(100).optional();

export type PageInput = z.infer<typeof pageInputSchema>;

/**
 * Runs the rows query and the count query for the same filter and returns one page.
 * Callers pass the `where` clause in both callbacks so the total matches the filtered rows.
 */
export async function paginate<T>(
	input: PageInput,
	fetchRows: (range: { limit: number; offset: number }) => Promise<T[]>,
	countRows: () => Promise<number>,
) {
	const { page, pageSize } = input;
	const [items, total] = await Promise.all([
		fetchRows({ limit: pageSize, offset: (page - 1) * pageSize }),
		countRows(),
	]);

	return {
		items,
		total,
		page,
		pageSize,
		totalPages: Math.max(1, Math.ceil(total / pageSize)),
	};
}
