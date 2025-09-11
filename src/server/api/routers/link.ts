import {
	createTRPCRouter,
	publicProcedure,
	protectedProcedure,
} from "~/server/api/trpc";
import {
	createLinkFormInputSchema,
	createLinkForNoteInputSchema,
	getExamByLinkIdInputSchema,
	getFormByLinkIdInputSchema,
	getLinkByNoteIdInputSchema,
	getLinksForFormsInputSchema,
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
	formByLinkId: publicProcedure
		.input(getFormByLinkIdInputSchema)
		.query(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.linkService.getFormByLinkId(input.linkId);
		}),
	examByLinkId: publicProcedure
		.input(getExamByLinkIdInputSchema)
		.query(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.linkService.getExamByLinkId(input.linkId);
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
	linksByForm: protectedProcedure
		.input(getLinksForFormsInputSchema)
		.query(async ({ ctx, input }) => {
			return await ctx.services({ ctx }).linkService.getLinksForForm(input);
		}),
	createLinkForForm: protectedProcedure
		.input(createLinkFormInputSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.linkService.createLinkForm(input, ctx.session.user.id);
		}),
});
