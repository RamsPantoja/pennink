import type { z } from "zod";
import type { TRPCContext } from "../trpc";
import { notes } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type { updateNoteInputSchema } from "../schemas/note";

type ShareLinkServiceContructor = {
	ctx: TRPCContext;
};

export class ShareLinkService {
	ctx: TRPCContext;

	constructor({ ctx }: ShareLinkServiceContructor) {
		this.ctx = ctx;
	}

	public async getSharedNote(shareLinkId: string) {
		const shareLinkToNote = await this.ctx.db.query.shareLinksToNotes.findFirst(
			{
				where: (sharedLinksToNotes, { eq }) => {
					return eq(sharedLinksToNotes.shareLinkId, shareLinkId);
				},
				with: {
					note: true,
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
}
