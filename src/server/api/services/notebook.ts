import type { z } from "zod";
import type { createNotebookInputSchema } from "../schemas/notebook";
import type { TRPCContext } from "../trpc";
import {
	chats,
	notebooks,
	notes,
	summaries,
	messages as messagesSchema,
} from "~/server/db/schema";
import { TRPCError } from "@trpc/server";

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
		const { name, messages, chatId } = data;

		const result = await this.ctx.db.transaction(async (tx) => {
			const [[chat], [summary], [note]] = await Promise.all([
				await tx
					.insert(chats)
					.values({
						id: chatId,
						userId,
					})
					.returning(),

				await tx
					.insert(summaries)
					.values({
						userId,
						content: "",
					})
					.returning(),

				await tx
					.insert(notes)
					.values({
						userId,
					})
					.returning(),

				await tx.insert(messagesSchema).values(messages),
			]);

			if (!chat || !summary || !note) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "Failed to create notebook",
				});
			}

			const [notebook] = await tx
				.insert(notebooks)
				.values({
					name,
					userId,
					chatId: chat.id,
					noteId: note.id,
					summaryId: summary.id,
				})
				.returning();

			if (!notebook) {
				throw new Error("Failed to create notebook");
			}

			return notebook;
		});

		return result;
	}

	public async getNotebooks(userId: string) {
		const notebooks = await this.ctx.db.query.notebooks.findMany({
			where: (notebooks, { eq, and }) => {
				return and(eq(notebooks.userId, userId));
			},
		});

		return notebooks;
	}

	public async getNotebookById(id: string) {
		const notebook = await this.ctx.db.query.notebooks.findFirst({
			where: (notebooks, { eq }) => {
				return eq(notebooks.id, id);
			},
		});

		if (!notebook) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Notebook not found",
			});
		}

		return notebook;
	}
}
