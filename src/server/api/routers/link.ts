import {
	createTRPCRouter,
	publicProcedure,
	protectedProcedure,
} from "~/server/api/trpc";
import {
	createLinkForNoteInputSchema,
	getLinkByNoteIdInputSchema,
	getNoteByLinkIdInputSchema,
} from "../schemas/link";

export const linkRouter = createTRPCRouter({
	noteByLinkId: publicProcedure
		.input(getNoteByLinkIdInputSchema)
		.query(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.linkService.getNoteByLinkId(input.linkId);
		}),
	createLinkForNote: protectedProcedure
		.input(createLinkForNoteInputSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.services({ ctx }).linkService.createLinkForNote(input);
		}),
	linkByNoteId: protectedProcedure
		.input(getLinkByNoteIdInputSchema)
		.query(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.linkService.getShareLinkByNoteId(input.noteId);
		}),
});
