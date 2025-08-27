import type { z } from "zod";
import type {
	createFileInputSchema,
	createWorkspaceInputSchema,
	documentVectorSearchInputSchema,
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
	statics,
} from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { and, eq, isNull, sql } from "drizzle-orm";
import { env } from "~/env";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embedMany, embed } from "ai";
import { embeddingDocuments } from "~/server/db/turso-schema";
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

export class WorkspaceService {
	ctx: TRPCContext;

	constructor({ ctx }: WorkspaceServiceContructor) {
		this.ctx = ctx;
	}

	public async create(data: createWorkspaceInput, userId: string) {
		const { name, messages, chatId } = data;

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

	public async getWorkspaces(userId: string) {
		const workspaces = await this.ctx.db.query.workspaces.findMany({
			where: (workspaces, { eq, and }) => {
				return and(eq(workspaces.userId, userId), isNull(workspaces.deletedAt));
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
		const model = bedrock.embedding("amazon.titan-embed-text-v2:0");
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
			const loader = new PDFLoader(blob);
			const docs = await loader.load();
			const allSplits = await textSplitter.splitDocuments(docs);

			const { embeddings, values } = await embedMany({
				model,
				values: allSplits.map((split) => split.pageContent),
			});

			//Create a vector index for the embedding column from the embedding_documents table
			await this.ctx.tursoDb.run(
				sql`CREATE INDEX IF NOT EXISTS embedding_index ON embedding_document(libsql_vector_idx(embedding))`,
			);

			await this.ctx.tursoDb.insert(embeddingDocuments).values(
				embeddings.map((embedding, index) => {
					return {
						embedding: sql`vector32(${JSON.stringify(embedding)})`,
						fileId: file.id,
						name: file.filename,
						userId,
						content: values[index] ?? "",
					};
				}),
			);

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

	public async getFilesByUserId(userId: string, searchTerm?: string) {
		const files = await this.ctx.db.query.files.findMany({
			where: (files, { eq, and, ilike }) => {
				const conditions = [eq(files.userId, userId)];

				if (searchTerm) {
					conditions.push(ilike(files.filename, `%${searchTerm}%`));
				}

				return and(...conditions);
			},
		});

		return files;
	}

	public async documentVectorSearch(input: DocumentVectorSearchInput) {
		try {
			const model = bedrock.embedding("amazon.titan-embed-text-v2:0");

			const embedding = await embed({
				model,
				value: input.query,
			});

			const topK = await this.ctx.tursoDb
				.select()
				.from(
					sql`vector_top_k('embedding_index', vector32(${JSON.stringify(embedding.embedding)}), 5)`,
				)
				.leftJoin(
					embeddingDocuments,
					eq(embeddingDocuments.id, sql`vector_top_k.id`),
				)
				.where(eq(embeddingDocuments.fileId, input.fileId));

			return topK;
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
			const [workspace] = await this.ctx.db
				.update(workspaces)
				.set({ deletedAt: new Date() })
				.where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)))
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
