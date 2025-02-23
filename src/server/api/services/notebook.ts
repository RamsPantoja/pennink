import type { z } from "zod";
import type { createNotebookInputSchema } from "../schemas/notebook";
import type { TRPCContext } from "../trpc";
import { notebooks } from "~/server/db/schema";

type NotebookServiceContructor = {
	ctx: TRPCContext;
};

type createNotebookInput = z.infer<typeof createNotebookInputSchema>;

export class NotebookService {
	ctx: TRPCContext;

	constructor({ ctx }: NotebookServiceContructor) {
		this.ctx = ctx;
	}

	public async create(data: createNotebookInput, userId: string) {
		const { name } = data;

		const [notebook] = await this.ctx.db
			.insert(notebooks)
			.values({
				name,
				userId,
			})
			.returning();

		if (!notebook) {
			throw new Error("Failed to create notebook");
		}

		return notebook;
	}

	public async getNotebooks(userId: string) {
		const notebooks = await this.ctx.db.query.notebooks.findMany({
			where: (notebooks, { eq, and }) => {
				return and(eq(notebooks.userId, userId));
			},
		});

		return notebooks;
	}
}
