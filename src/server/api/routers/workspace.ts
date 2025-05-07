import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
	createWorkspaceInputSchema,
	workspaceByIdInputSchema,
	updateWorkspaceNameInputSchema,
	createFileInputSchema,
	documentVectorSearchInputSchema,
	deleteWorkspaceInputSchema,
	getFilesByUserInputSchema,
} from "../schemas/workspace";

export const workspaceRouter = createTRPCRouter({
	workspaces: protectedProcedure.query(async ({ ctx }) => {
		return await ctx
			.services({ ctx })
			.workspaceService.getWorkspaces(ctx.session.user.id);
	}),
	filesByUserId: protectedProcedure
		.input(getFilesByUserInputSchema)
		.query(async ({ input, ctx }) => {
			return await ctx
				.services({ ctx })
				.workspaceService.getFilesByUserId(ctx.session.user.id, input.search);
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
	createFile: protectedProcedure
		.input(createFileInputSchema)
		.mutation(async ({ input, ctx }) => {
			return await ctx
				.services({ ctx })
				.workspaceService.createFile(input, ctx.session.user.id);
		}),
	documentVectorSearch: protectedProcedure
		.input(documentVectorSearchInputSchema)
		.mutation(async ({ input, ctx }) => {
			return await ctx
				.services({ ctx })
				.workspaceService.documentVectorSearch(input);
		}),
	deleteWorkspace: protectedProcedure
		.input(deleteWorkspaceInputSchema)
		.mutation(async ({ input, ctx }) => {
			return await ctx
				.services({ ctx })
				.workspaceService.delete(input.id, ctx.session.user.id);
		}),
});
