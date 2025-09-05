import type { z } from "zod";
import type { TRPCContext } from "../trpc";
import { notes } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type { updateNoteInputSchema } from "../schemas/note";

type NoteServiceContructor = {
	ctx: TRPCContext;
};

type UpdateNoteInput = z.infer<typeof updateNoteInputSchema>;

export class NoteService {
	ctx: TRPCContext;

	constructor({ ctx }: NoteServiceContructor) {
		this.ctx = ctx;
	}

	public async update(input: UpdateNoteInput) {
		const [note] = await this.ctx.db
			.update(notes)
			.set({
				content: input.content,
			})
			.where(eq(notes.id, input.noteId))
			.returning();

		if (!note) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Note not found",
			});
		}

		return note;
	}

	public async getNoteById(noteId: string) {
		const note = await this.ctx.db.query.notes.findFirst({
			where: (notes, { eq }) => {
				return eq(notes.id, noteId);
			},
		});

		if (!note) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Note not found",
			});
		}

		return note;
	}
}
