import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import {
	createPlanArtifactInputSchema,
	planArtifactByIdInputSchema,
	updatePlanArtifactInputSchema,
} from "../schemas/plan-artifact";

export const planArtifactRouter = createTRPCRouter({
	listAll: protectedProcedure.query(({ ctx }) =>
		ctx.services({ ctx }).planArtifactService.listAll(ctx.session.user.id),
	),
	byId: protectedProcedure
		.input(planArtifactByIdInputSchema)
		.query(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.planArtifactService.getById(input.id, ctx.session.user.id),
		),
	create: protectedProcedure
		.input(createPlanArtifactInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.planArtifactService.create(input, ctx.session.user.id),
		),
	update: protectedProcedure
		.input(updatePlanArtifactInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.planArtifactService.update(input, ctx.session.user.id),
		),
});
