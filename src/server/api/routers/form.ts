import { createFormSchema, getDataSchema } from "../schemas/form";
import { createTRPCRouter, protectedProcedure } from "../trpc";

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
});
