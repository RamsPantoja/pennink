import type { z } from "zod";
import type { TRPCContext } from "../trpc";
import { notes, shareLinks, shareLinksToNotes } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type { updateNoteInputSchema } from "../schemas/note";
import type { createShareLinkForNoteInputSchema } from "../schemas/shareLink";

type ShareLinkServiceContructor = {
	ctx: TRPCContext;
};

type CreateShareLinkForNoteInputSchema = z.infer<
	typeof createShareLinkForNoteInputSchema
>;

export class ShareLinkService {
	ctx: TRPCContext;

	constructor({ ctx }: ShareLinkServiceContructor) {
		this.ctx = ctx;
	}

	public async createShareLinkForNote(
		input: CreateShareLinkForNoteInputSchema,
	) {
		const { noteId, key } = input;

		const res = await this.ctx.db.transaction(async (tx) => {
			const note = await tx.query.notes.findFirst({
				where: (notes, { eq }) => eq(notes.id, noteId),
			});

			if (!note) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Note not found",
				});
			}

			const [shareLink] = await tx
				.insert(shareLinks)
				.values({ key })
				.returning();

			if (!shareLink) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create share link",
				});
			}

			const [shareLinkToNote] = await tx
				.insert(shareLinksToNotes)
				.values({
					shareLinkId: shareLink.id,
					noteId,
				})
				.returning();

			if (!shareLinkToNote) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create share link to note",
				});
			}

			return shareLinkToNote;
		});

		return res;
	}

	public async getNoteByShareLinkId(shareLinkId: string) {
		const shareLinkToNote = await this.ctx.db.query.shareLinksToNotes.findFirst(
			{
				where: (sharedLinksToNotes, { eq }) => {
					return eq(sharedLinksToNotes.shareLinkId, shareLinkId);
				},
				with: {
					note: {
						with: {
							user: {
								columns: {
									name: true,
								},
							},
						},
					},
				},
			},
		);

		if (!shareLinkToNote) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Note not found",
			});
		}

		return shareLinkToNote;
	}

	public async getShareLinkByNoteId(noteId: string) {
		const shareLink = await this.ctx.db.query.shareLinksToNotes.findFirst({
			where: (sharedLinksToNotes, { eq }) => {
				return eq(sharedLinksToNotes.noteId, noteId);
			},
			with: {
				shareLink: true,
			},
		});

		if (!shareLink) {
			return null;
		}

		return shareLink;
	}
}
