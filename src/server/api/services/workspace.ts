import type { z } from "zod";
import type {
	createFileInputSchema,
	createWorkspaceInputSchema,
	updateWorkspaceNameInputSchema,
} from "../schemas/workspace";
import type { TRPCContext } from "../trpc";
import {
	chats,
	workspaces,
	notes,
	summaries,
	messages as messagesSchema,
	files,
	filesToWorkspaces,
} from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { env } from "~/env";

type WorkspaceServiceContructor = {
	ctx: TRPCContext;
};

type createWorkspaceInput = z.infer<typeof createWorkspaceInputSchema>;
type updateWorkspaceNameInput = z.infer<typeof updateWorkspaceNameInputSchema>;
type CreateFileInput = z.infer<typeof createFileInputSchema>;

export class WorkspaceService {
	ctx: TRPCContext;

	constructor({ ctx }: WorkspaceServiceContructor) {
		this.ctx = ctx;
	}

	public async create(data: createWorkspaceInput, userId: string) {
		const { name, messages, chatId } = data;

		const result = await this.ctx.db.transaction(async (tx) => {
			const [[chat], [summary], [note]] = await Promise.all([
				await tx
					.insert(chats)
					.values({
						id: chatId,
						userId,
					})
					.returning(),

				await tx
					.insert(summaries)
					.values({
						userId,
						content: "",
					})
					.returning(),

				await tx
					.insert(notes)
					.values({
						userId,
					})
					.returning(),

				await tx.insert(messagesSchema).values(messages),
			]);

			if (!chat || !summary || !note) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: "Failed to create workspace",
				});
			}

			const [workspace] = await tx
				.insert(workspaces)
				.values({
					name,
					userId,
					chatId: chat.id,
					noteId: note.id,
					summaryId: summary.id,
				})
				.returning();

			if (!workspace) {
				throw new Error("Failed to create workspace");
			}

			return workspace;
		});

		return result;
	}

	public async getWorkspaces(userId: string) {
		const workspaces = await this.ctx.db.query.workspaces.findMany({
			where: (workspaces, { eq, and }) => {
				return and(eq(workspaces.userId, userId));
			},
		});

		return workspaces;
	}

	public async getWorkspaceById(id: string) {
		const workspace = await this.ctx.db.query.workspaces.findFirst({
			where: (workspaces, { eq }) => {
				return eq(workspaces.id, id);
			},
			with: {
				note: true,
			},
		});

		if (!workspace) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Workspace not found",
			});
		}

		return workspace;
	}

	public async updateWorkspaceName(input: updateWorkspaceNameInput) {
		const workspace = await this.ctx.db.query.workspaces.findFirst({
			where: (workspaces, { eq }) => {
				return eq(workspaces.id, input.id);
			},
		});

		if (!workspace) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Workspace not found",
			});
		}

		const [updatedWorkspace] = await this.ctx.db
			.update(workspaces)
			.set({
				name: input.name,
			})
			.where(eq(workspaces.id, input.id))
			.returning();

		if (!updatedWorkspace) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Failed to update workspace",
			});
		}

		return updatedWorkspace;
	}

	public async createFile(input: CreateFileInput, userId: string) {
		try {
			const { filename, type, key, workspaceId } = input;

			const [file] = await this.ctx.db
				.insert(files)
				.values({
					filename,
					type,
					key,
					bucket: env.BUCKET,
					userId,
				})
				.returning();

			if (!file) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Failed to create file",
				});
			}

			await this.ctx.db
				.insert(filesToWorkspaces)
				.values({
					fileId: file.id,
					workspaceId,
				})
				.returning();

			return file;
		} catch {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Failed to update workspace",
			});
		}
	}
}
