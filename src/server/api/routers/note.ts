import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import {
	noteByIdInputSchema,
	sharedNoteInputSchema,
	updateNoteInputSchema,
} from "../schemas/note";

export const noteRouter = createTRPCRouter({
	updateNote: protectedProcedure
		.input(updateNoteInputSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.services({ ctx }).noteService.update(input);
		}),
	noteById: protectedProcedure
		.input(noteByIdInputSchema)
		.query(async ({ ctx, input }) => {
			return await ctx.services({ ctx }).noteService.getNoteById(input.id);
		}),
});
