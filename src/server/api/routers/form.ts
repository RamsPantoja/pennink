import {
	createFormSchema,
	editFormSchema,
	getDataSchema,
	getFormsSchema,
	saveExamResponsesSchema,
	saveFormResponsesSchema,
} from "../schemas/form";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";

export const formRouter = createTRPCRouter({
	create: protectedProcedure
		.input(createFormSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.services({ ctx }).formService.create({
				createFormInputSchema: input,
				session: ctx.session,
			});
		}),
	getData: protectedProcedure
		.input(getDataSchema)
		.query(async ({ ctx, input }) => {
			return await ctx.services({ ctx }).formService.getData(input);
		}),
	edit: protectedProcedure
		.input(editFormSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.services({ ctx }).formService.edit(input);
		}),
	forms: protectedProcedure
		.input(getFormsSchema)
		.query(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.formService.getForms(input, ctx.session.user.id);
		}),
	saveFormResponses: publicProcedure
		.input(saveFormResponsesSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.services({ ctx }).formService.saveFormResponses(input);
		}),
	saveExamResponses: publicProcedure
		.input(saveExamResponsesSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.services({ ctx }).formService.saveExamResponses(input);
		}),
});
