import type { z } from "zod";
import type {
	createFileInputSchema,
	createWorkspaceInputSchema,
	documentVectorSearchInputSchema,
	getFilesByUserInputSchema,
	updateWorkspaceNameInputSchema,
	workspaceSourceInputSchema,
} from "../schemas/workspace";
import type { TRPCContext } from "../../trpc";
import { userHasClassroom } from "./classroom";
import {
	chats,
	workspaces,
	classroomTeachers,
	notes,
	summaries,
	messages as messagesSchema,
	files,
	filesToWorkspaces,
	statics,
	embeddingDocuments,
} from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import {
	and,
	count,
	desc,
	eq,
	ilike,
	inArray,
	isNull,
} from "drizzle-orm";
import { paginate } from "../schemas/pagination";
import { env } from "~/env";
import { loadSourceDocuments } from "~/server/lib/loadSourceDocuments";
import { isSourceDocumentType, SOURCE_DOCUMENT_TYPES } from "~/lib/documentTypes";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embedMany } from "ai";
import { searchDocumentChunks } from "./document-search";
import { DateTime } from "luxon";
import { bedrock } from "@ai-sdk/amazon-bedrock";

type WorkspaceServiceContructor = {
	ctx: TRPCContext;
};

type createWorkspaceInput = z.infer<typeof createWorkspaceInputSchema>;
type updateWorkspaceNameInput = z.infer<typeof updateWorkspaceNameInputSchema>;
type CreateFileInput = z.infer<typeof createFileInputSchema>;
type DocumentVectorSearchInput = z.infer<
	typeof documentVectorSearchInputSchema
>;
type WorkspaceSourceInput = z.infer<typeof workspaceSourceInputSchema>;

export class WorkspaceService {
	ctx: TRPCContext;

	constructor({ ctx }: WorkspaceServiceContructor) {
		this.ctx = ctx;
	}

	public async create(data: createWorkspaceInput, userId: string) {
		const { name, messages, chatId, classroomId } = data;

		if (!(await userHasClassroom(this.ctx.db, userId))) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Create a classroom before creating a workspace",
			});
		}

		await this.assertClassroomTeacher(classroomId, userId);

		const ruleRes = await this.workspaceCreationRule(userId);

		const result = await this.ctx.db.transaction(async (tx) => {
			const insertMessages = async () => {
				if (messages.length > 0) {
					return await tx.insert(messagesSchema).values(messages).returning();
				}
			};

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

				await insertMessages(),
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
					classroomId,
					chatId: chat.id,
					noteId: note.id,
					summaryId: summary.id,
				})
				.returning();

			if (!workspace) {
				throw new Error("Failed to create workspace");
			}

			await tx
				.update(statics)
				.set({
					workspaces: ruleRes.workspaces + 1,
				})
				.where(eq(statics.id, ruleRes.id));

			return workspace;
		});

		return result;
	}

	public async getWorkspaces(classroomId: string, userId: string) {
		await this.assertClassroomTeacher(classroomId, userId);
		const workspaces = await this.ctx.db.query.workspaces.findMany({
			where: (workspaces, { eq, and }) => {
				return and(
					eq(workspaces.classroomId, classroomId),
					isNull(workspaces.deletedAt),
				);
			},
			orderBy: (workspaces, { desc }) => {
				return desc(workspaces.updatedAt);
			},
		});

		return workspaces;
	}

	private async workspaceCreationRule(userId: string) {
		const limitWorkspaces = 2;
		const limitedWorkspacesMessage = `You have reached the maximum number of workspaces (${limitWorkspaces}). Upgrade to Pennink Pro to get unlimited workspaces.`;
		const userStatics = await this.ctx.db.query.statics.findFirst({
			where: (statics, { eq }) => {
				return eq(statics.userId, userId);
			},
			with: {
				user: true,
			},
		});

		if (!userStatics) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "User statics not found",
			});
		}

		const ruleForFreeSub = async () => {
			const referenceDate = DateTime.fromJSDate(
				userStatics.workspacesResetedAt,
			);
			const currentDate = DateTime.now();
			const diff = currentDate.diff(referenceDate, "days");

			if (diff.days < 1 && userStatics.workspaces >= limitWorkspaces) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: limitedWorkspacesMessage,
				});
			}

			if (diff.days >= 1) {
				//Reset workspaces metric to 0 to allow user create new workspaces
				const [resetedStatics] = await this.ctx.db
					.update(statics)
					.set({
						workspaces: 0,
						workspacesResetedAt: new Date(),
					})
					.where(eq(statics.id, userStatics.id))
					.returning();

				if (!resetedStatics) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to reset workspaces",
					});
				}

				return resetedStatics;
			}

			return userStatics;
		};

		switch (userStatics.user.subscription) {
			case "PRO": {
				return userStatics;
			}
			case "FREE": {
				return await ruleForFreeSub();
			}
			default:
				return await ruleForFreeSub();
		}
	}

	public async getWorkspaceById(id: string, userId: string) {
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
		await this.assertClassroomTeacher(workspace.classroomId, userId);

		return workspace;
	}

	private async assertClassroomTeacher(classroomId: string, userId: string) {
		const teacher = await this.ctx.db.query.classroomTeachers.findFirst({
			where: (table, { eq, and }) =>
				and(eq(table.classroomId, classroomId), eq(table.userId, userId)),
		});
		if (!teacher) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Classroom not found",
			});
		}
	}

	public async updateWorkspaceName(
		input: updateWorkspaceNameInput,
		userId: string,
	) {
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
		await this.assertClassroomTeacher(workspace.classroomId, userId);

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

	private async createFileRule(userId: string) {
		const limitFiles = 5;
		const limitedUploadFilesMessageFreeSub = `You have reached the maximum number of uploads/day (${limitFiles}). Upgrade to Pennink Pro to get unlimited uploads.`;
		const userStatics = await this.ctx.db.query.statics.findFirst({
			where: (statics, { eq }) => {
				return eq(statics.userId, userId);
			},
			with: {
				user: true,
			},
		});

		if (!userStatics) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "User statics not found",
			});
		}

		const ruleForFreeSub = async () => {
			const referenceDate = DateTime.fromJSDate(
				userStatics.workspacesResetedAt, //Working with workspaces resetDate
			);
			const currentDate = DateTime.now();
			const diff = currentDate.diff(referenceDate, "days");

			if (diff.days < 1 && userStatics.files >= limitFiles) {
				throw new TRPCError({
					code: "PRECONDITION_FAILED",
					message: limitedUploadFilesMessageFreeSub,
				});
			}

			//Reset files metric to 0 to allow user upload files again
			if (diff.days >= 1) {
				await this.ctx.db
					.update(statics)
					.set({
						files: 0,
						workspacesResetedAt: new Date(),
					})
					.where(eq(statics.id, userStatics.id));
			}
		};

		switch (userStatics.user.subscription) {
			case "PRO":
				{
				}
				break;
			case "FREE":
				{
					await ruleForFreeSub();
				}
				break;
			default:
				{
					await ruleForFreeSub();
				}
				break;
		}

		return userStatics;
	}

	public async createFile(input: CreateFileInput, userId: string) {
		if (!isSourceDocumentType(input.type)) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Unsupported file type",
			});
		}

		const model = bedrock.embeddingModel("amazon.titan-embed-text-v2:0");
		const textSplitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 200,
		});

		const result = await this.ctx.db.transaction(async (tx) => {
			const { filename, type, key, workspaceId } = input;
			const ruleRes = await this.createFileRule(userId);

			const [file] = await tx
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

			await tx
				.insert(filesToWorkspaces)
				.values({
					fileId: file.id,
					workspaceId,
				})
				.returning();

			const docFromCloudStorage = await fetch(
				`${env.BUCKET_PUBLIC_DOMAIN}/${file.key}`,
			);
			const blob = await docFromCloudStorage.blob();
			const docs = await loadSourceDocuments(blob, input.type, file.filename);
			const allSplits = await textSplitter.splitDocuments(docs);

			const { embeddings, values } = await embedMany({
				model,
				values: allSplits.map((split) => split.pageContent),
				maxRetries: 5,
			});

			const embeddingRows = embeddings.map((embedding, index) => ({
				embedding,
				fileId: file.id,
				name: file.filename,
				userId,
				content: values[index] ?? "",
			}));

			// Insert in batches to stay under Postgres' bind-parameter limit
			for (let i = 0; i < embeddingRows.length; i += 500) {
				await tx
					.insert(embeddingDocuments)
					.values(embeddingRows.slice(i, i + 500));
			}

			await tx
				.update(statics)
				.set({
					files: ruleRes.files + 1,
				})
				.where(eq(statics.id, ruleRes.id));

			return file;
		});

		return result;
	}

	public async getFilesByUserId(
		input: z.infer<typeof getFilesByUserInputSchema>,
		userId: string,
	) {
		const { search, page, pageSize } = input;
		const where = and(
			eq(files.userId, userId),
			inArray(files.type, Object.keys(SOURCE_DOCUMENT_TYPES)),
			search ? ilike(files.filename, `%${search}%`) : undefined,
		);

		return paginate(
			{ page, pageSize },
			({ limit, offset }) =>
				this.ctx.db
					.select()
					.from(files)
					.where(where)
					.orderBy(desc(files.createdAt), desc(files.id))
					.limit(limit)
					.offset(offset),
			async () => {
				const [row] = await this.ctx.db
					.select({ total: count() })
					.from(files)
					.where(where);
				return row?.total ?? 0;
			},
		);
	}

	private async assertWorkspaceTeacher(workspaceId: string, userId: string) {
		const workspace = await this.ctx.db.query.workspaces.findFirst({
			where: (table, { eq }) => eq(table.id, workspaceId),
		});

		if (!workspace) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Workspace not found",
			});
		}

		await this.assertClassroomTeacher(workspace.classroomId, userId);
	}

	public async getSourcesByWorkspace(workspaceId: string, userId: string) {
		await this.assertWorkspaceTeacher(workspaceId, userId);

		const rows = await this.ctx.db.query.filesToWorkspaces.findMany({
			where: (table, { eq }) => eq(table.workspaceId, workspaceId),
			with: {
				file: true,
			},
		});

		return rows.map((row) => row.file);
	}

	public async attachSource(input: WorkspaceSourceInput, userId: string) {
		await this.assertWorkspaceTeacher(input.workspaceId, userId);

		const file = await this.ctx.db.query.files.findFirst({
			where: (table, { eq, and }) =>
				and(eq(table.id, input.fileId), eq(table.userId, userId)),
		});

		if (!file) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "File not found",
			});
		}

		await this.ctx.db
			.insert(filesToWorkspaces)
			.values({
				fileId: input.fileId,
				workspaceId: input.workspaceId,
			})
			.onConflictDoNothing();
	}

	public async detachSource(input: WorkspaceSourceInput, userId: string) {
		await this.assertWorkspaceTeacher(input.workspaceId, userId);

		await this.ctx.db
			.delete(filesToWorkspaces)
			.where(
				and(
					eq(filesToWorkspaces.fileId, input.fileId),
					eq(filesToWorkspaces.workspaceId, input.workspaceId),
				),
			);
	}

	public async documentVectorSearch(input: DocumentVectorSearchInput) {
		try {
			return await searchDocumentChunks({
				db: this.ctx.db,
				query: input.query,
				fileIds: input.fileIds,
			});
		} catch (error) {
			console.log(error);
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Failed to search documents",
			});
		}
	}

	public async delete(id: string, userId: string) {
		try {
			const existingWorkspace = await this.ctx.db.query.workspaces.findFirst({
				where: (table, { eq }) => eq(table.id, id),
			});
			if (!existingWorkspace) throw new TRPCError({ code: "NOT_FOUND" });
			await this.assertClassroomTeacher(existingWorkspace.classroomId, userId);
			const [workspace] = await this.ctx.db
				.update(workspaces)
				.set({ deletedAt: new Date() })
				.where(eq(workspaces.id, id))
				.returning();

			if (!workspace) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Workspace not found",
				});
			}

			return workspace;
		} catch (error) {
			console.log(error);
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Failed to delete workspace",
			});
		}
	}

	public uploadFilesRule(userId: string) {
		return this.createFileRule(userId);
	}
}
