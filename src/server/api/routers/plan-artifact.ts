import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import {
	createPlanArtifactInputSchema,
	listPlanArtifactsInputSchema,
	planArtifactByIdInputSchema,
	updatePlanArtifactInputSchema,
	workspacePlanArtifactInputSchema,
	workspacePlanArtifactsInputSchema,
} from "../schemas/plan-artifact";

export const planArtifactRouter = createTRPCRouter({
	listAll: protectedProcedure
		.input(listPlanArtifactsInputSchema)
		.query(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.planArtifactService.listAll(input, ctx.session.user.id),
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
	listForWorkspace: protectedProcedure
		.input(workspacePlanArtifactsInputSchema)
		.query(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.planArtifactService.listForWorkspace(input, ctx.session.user.id),
		),
	attachToWorkspace: protectedProcedure
		.input(workspacePlanArtifactInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.planArtifactService.attachToWorkspace(input, ctx.session.user.id),
		),
	detachFromWorkspace: protectedProcedure
		.input(workspacePlanArtifactInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.planArtifactService.detachFromWorkspace(input, ctx.session.user.id),
		),
});
