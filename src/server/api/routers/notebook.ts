import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
	createNotebookInputSchema,
	notebookByIdInputSchema,
} from "../schemas/notebook";

export const notebookRouter = createTRPCRouter({
	notebooks: protectedProcedure.query(async ({ ctx }) => {
		return await ctx
			.services({ ctx })
			.notebookService.getNotebooks(ctx.session.user.id);
	}),
	notebookById: protectedProcedure
		.input(notebookByIdInputSchema)
		.query(async ({ input, ctx }) => {
			return await ctx
				.services({ ctx })
				.notebookService.getNotebookById(input.id);
		}),
	create: protectedProcedure
		.input(createNotebookInputSchema)
		.mutation(async ({ input, ctx }) => {
			return await ctx
				.services({ ctx })
				.notebookService.create(input, ctx.session.user.id);
		}),
});
