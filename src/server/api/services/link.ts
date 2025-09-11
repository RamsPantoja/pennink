import type { z } from "zod";
import type { TRPCContext } from "../trpc";
import { examLinks, formLinks, noteLinks } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import type {
	createLinkFormInputSchema,
	createLinkForNoteInputSchema,
	getLinksForFormsInputSchema,
} from "../schemas/link";
import { FormType } from "~/lib/enum";

type LinkServiceContructor = {
	ctx: TRPCContext;
};

type CreateLinkForNoteInputSchema = z.infer<
	typeof createLinkForNoteInputSchema
>;

type GetLinksForFormsInputSchema = z.infer<typeof getLinksForFormsInputSchema>;
type CreateLinkFormInputSchema = z.infer<typeof createLinkFormInputSchema>;

export class LinkService {
	ctx: TRPCContext;

	constructor({ ctx }: LinkServiceContructor) {
		this.ctx = ctx;
	}

	public async createLinkForNote(input: CreateLinkForNoteInputSchema) {
		const { noteId } = input;

		const res = await this.ctx.db.transaction(async (tx) => {
			const note = await tx.query.notes.findFirst({
				where: (notes, { eq }) => eq(notes.id, noteId),
			});

			if (!note) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Note not found",
				});
			}

			const [link] = await tx.insert(noteLinks).values({ noteId }).returning();

			if (!link) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Failed to create link",
				});
			}

			return link;
		});

		return res;
	}

	public async getNoteByLinkId(linkId: string) {
		const note = await this.ctx.db.query.noteLinks.findFirst({
			where: (noteLinks, { eq }) => {
				return eq(noteLinks.id, linkId);
			},
			with: {
				note: {
					with: {
						user: {
							columns: {
								name: true,
								image: true,
							},
						},
					},
				},
			},
		});

		if (!note) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Note not found",
			});
		}

		return note;
	}

	public async getShareLinkByNoteId(noteId: string) {
		const link = await this.ctx.db.query.noteLinks.findFirst({
			where: (noteLinks, { eq }) => {
				return eq(noteLinks.noteId, noteId);
			},
		});

		if (!link) {
			return null;
		}

		return link;
	}

	public async getLinksForForm(input: GetLinksForFormsInputSchema) {
		const { type, key, id } = input;

		switch (type) {
			case "BASIC": {
				const formVersion = await this.ctx.db.query.formVersions.findFirst({
					where: (formVersions, { eq }) => {
						return eq(formVersions.formId, id);
					},
					orderBy: (formVersions, { desc }) => [desc(formVersions.version)],
				});

				if (!formVersion) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Form version not found",
					});
				}

				const links = await this.ctx.db.query.formLinks.findMany({
					where: (formLinks, { eq, and, ilike }) => {
						const conditions = [eq(formLinks.formVersionId, formVersion.id)];

						if (key) {
							conditions.push(ilike(formLinks.key, `%${key}%`));
						}

						return and(...conditions);
					},
					with: {
						formVersion: true,
					},
					orderBy: (formLinks, { desc }) => [desc(formLinks.id)],
				});

				return { links, type };
			}
			case "EXAM": {
				const examVersion = await this.ctx.db.query.examVersions.findFirst({
					where: (examVersions, { eq }) => {
						return eq(examVersions.examId, id);
					},
					orderBy: (examVersions, { desc }) => [desc(examVersions.version)],
				});

				if (!examVersion) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Exam version not found",
					});
				}

				const links = await this.ctx.db.query.examLinks.findMany({
					where: (examLinks, { eq, and, ilike }) => {
						const conditions = [eq(examLinks.examVersionId, examVersion.id)];

						if (key) {
							conditions.push(ilike(examLinks.key, `%${key}%`));
						}

						return and(...conditions);
					},
					with: {
						examVersion: true,
					},
					orderBy: (examLinks, { desc }) => [desc(examLinks.id)],
				});

				return { links, type };
			}
		}
	}

	public async createLinkForm(
		input: CreateLinkFormInputSchema,
		userId: string,
	) {
		const { type, key, id } = input;

		switch (type) {
			case "BASIC": {
				const formVersion = await this.ctx.db.query.formVersions.findFirst({
					where: (formVersions, { eq }) => {
						return eq(formVersions.formId, id);
					},
					orderBy: (formVersions, { desc }) => [desc(formVersions.version)],
				});

				if (!formVersion) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Form version not found",
					});
				}

				const [link] = await this.ctx.db
					.insert(formLinks)
					.values({
						formVersionId: formVersion.id,
						key,
						userId,
					})
					.returning();

				if (!link) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create link for form",
					});
				}

				return link;
			}
			case "EXAM": {
				const examVersion = await this.ctx.db.query.examVersions.findFirst({
					where: (examVersions, { eq }) => {
						return eq(examVersions.examId, id);
					},
					orderBy: (examVersions, { desc }) => [desc(examVersions.version)],
				});

				if (!examVersion) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Exam version not found",
					});
				}

				const [link] = await this.ctx.db
					.insert(examLinks)
					.values({
						examVersionId: examVersion.id,
						key,
						userId,
					})
					.returning();

				if (!link) {
					throw new TRPCError({
						code: "INTERNAL_SERVER_ERROR",
						message: "Failed to create link for exam",
					});
				}

				return link;
			}
		}
	}

	public async getFormByLinkId(linkId: string) {
		const form = await this.ctx.db.query.formLinks.findFirst({
			where: (formLinks, { eq }) => {
				return eq(formLinks.id, linkId);
			},
			with: {
				formVersion: {
					with: {
						form: {
							with: {
								user: {
									columns: {
										name: true,
										image: true,
									},
								},
							},
						},
						questionsToFormVersions: {
							with: {
								question: {
									with: {
										questionOptions: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!form) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Form not found",
			});
		}

		return form;
	}

	public async getExamByLinkId(linkId: string) {
		const exam = await this.ctx.db.query.examLinks.findFirst({
			where: (examLinks, { eq }) => {
				return eq(examLinks.id, linkId);
			},
			with: {
				examVersion: {
					with: {
						exam: {
							with: {
								user: {
									columns: {
										name: true,
										image: true,
									},
								},
							},
						},
						questionsToExamVersions: {
							with: {
								question: {
									with: {
										questionOptions: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!exam) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Exam not found",
			});
		}

		return exam;
	}
}
