import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { getSharedNoteInputSchema } from "../schemas/shareLink";

export const shareLinkRouter = createTRPCRouter({
	getSharedNote: publicProcedure
		.input(getSharedNoteInputSchema)
		.query(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.shareLinkService.getSharedNote(input.shareLinkId);
		}),
});
