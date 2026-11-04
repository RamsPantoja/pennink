import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import {
	createEvaluationSchemaInputSchema,
	evaluationSchemaByIdInputSchema,
	listEvaluationSchemasInputSchema,
	updateEvaluationSchemaInputSchema,
} from "../schemas/evaluation-schema";

export const evaluationSchemaRouter = createTRPCRouter({
	list: protectedProcedure
		.input(listEvaluationSchemasInputSchema)
		.query(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.evaluationSchemaService.list(input, ctx.session.user.id),
		),
	byId: protectedProcedure
		.input(evaluationSchemaByIdInputSchema)
		.query(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.evaluationSchemaService.getById(input.id, ctx.session.user.id),
		),
	create: protectedProcedure
		.input(createEvaluationSchemaInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.evaluationSchemaService.create(input, ctx.session.user.id),
		),
	update: protectedProcedure
		.input(updateEvaluationSchemaInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.evaluationSchemaService.update(input, ctx.session.user.id),
		),
	duplicate: protectedProcedure
		.input(evaluationSchemaByIdInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.evaluationSchemaService.duplicate(input.id, ctx.session.user.id),
		),
	delete: protectedProcedure
		.input(evaluationSchemaByIdInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.evaluationSchemaService.delete(input.id, ctx.session.user.id),
		),
});
