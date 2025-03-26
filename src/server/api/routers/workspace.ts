import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
	createWorkspaceInputSchema,
	workspaceByIdInputSchema,
	updateWorkspaceNameInputSchema,
} from "../schemas/workspace";

export const workspaceRouter = createTRPCRouter({
	workspaces: protectedProcedure.query(async ({ ctx }) => {
		return await ctx
			.services({ ctx })
			.workspaceService.getWorkspaces(ctx.session.user.id);
	}),
	workspaceById: protectedProcedure
		.input(workspaceByIdInputSchema)
		.query(async ({ input, ctx }) => {
			return await ctx
				.services({ ctx })
				.workspaceService.getWorkspaceById(input.id);
		}),
	create: protectedProcedure
		.input(createWorkspaceInputSchema)
		.mutation(async ({ input, ctx }) => {
			return await ctx
				.services({ ctx })
				.workspaceService.create(input, ctx.session.user.id);
		}),
	updateName: protectedProcedure
		.input(updateWorkspaceNameInputSchema)
		.mutation(async ({ input, ctx }) => {
			return await ctx
				.services({ ctx })
				.workspaceService.updateWorkspaceName(input);
		}),
});
