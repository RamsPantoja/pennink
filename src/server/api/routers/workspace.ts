import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import {
	createWorkspaceInputSchema,
	workspaceByIdInputSchema,
	updateWorkspaceNameInputSchema,
	createFileInputSchema,
	documentVectorSearchInputSchema,
	deleteWorkspaceInputSchema,
	getFilesByUserInputSchema,
	workspacesByClassroomInputSchema,
} from "../schemas/workspace";

export const workspaceRouter = createTRPCRouter({
	workspaces: protectedProcedure
		.input(workspacesByClassroomInputSchema)
		.query(async ({ input, ctx }) => {
			return await ctx
				.services({ ctx })
				.workspaceService.getWorkspaces(input.classroomId, ctx.session.user.id);
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
				.workspaceService.getWorkspaceById(input.id, ctx.session.user.id);
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
				.workspaceService.updateWorkspaceName(input, ctx.session.user.id);
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
	triggerUploadFilesRule: protectedProcedure.mutation(async ({ ctx }) => {
		return await ctx
			.services({ ctx })
			.workspaceService.uploadFilesRule(ctx.session.user.id);
	}),
});
