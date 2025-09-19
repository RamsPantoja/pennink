import {
	createFormSchema,
	editFormSchema,
	getDataSchema,
	getExamResultSchema,
	getExamResultsSchema,
	getFormResponseSchema,
	getFormResponsesSchema,
	getFormsSchema,
	saveExamResultsSchema,
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
	saveExamResults: publicProcedure
		.input(saveExamResultsSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx.services({ ctx }).formService.saveExamResults(input);
		}),
	examResults: protectedProcedure
		.input(getExamResultsSchema)
		.query(async ({ ctx, input }) => {
			return await ctx.services({ ctx }).formService.getExamResults(input);
		}),
	formResponses: protectedProcedure
		.input(getFormResponsesSchema)
		.query(async ({ ctx, input }) => {
			return await ctx.services({ ctx }).formService.getFormResponses(input);
		}),
	formResponse: protectedProcedure
		.input(getFormResponseSchema)
		.query(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.formService.getFormResponse(input.formResponseId);
		}),
	examResult: protectedProcedure
		.input(getExamResultSchema)
		.query(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.formService.getExamResult(input.examResultId);
		}),
});
