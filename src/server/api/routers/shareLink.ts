import {
	createTRPCRouter,
	publicProcedure,
	protectedProcedure,
} from "~/server/api/trpc";
import {
	createShareLinkForNoteInputSchema,
	getNoteByShareLinkIdInputSchema,
	getShareLinkByNoteIdInputSchema,
} from "../schemas/shareLink";

export const shareLinkRouter = createTRPCRouter({
	noteByShareLinkId: publicProcedure
		.input(getNoteByShareLinkIdInputSchema)
		.query(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.shareLinkService.getNoteByShareLinkId(input.shareLinkId);
		}),
	createShareLinkForNote: protectedProcedure
		.input(createShareLinkForNoteInputSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.shareLinkService.createShareLinkForNote(input);
		}),
	shareLinkByNoteId: protectedProcedure
		.input(getShareLinkByNoteIdInputSchema)
		.query(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.shareLinkService.getShareLinkByNoteId(input.noteId);
		}),
});
