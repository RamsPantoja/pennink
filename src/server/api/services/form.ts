import { z } from "zod";
import type { TRPCContext } from "../trpc";
import type { Session } from "next-auth";
import { TRPCError } from "@trpc/server";
import {
	forms,
	exams,
	questions as questionsSchema,
	questionOptions,
	examVersions,
	questionsToExamVersions,
	formVersions,
	questionsToFormVersions,
	formResponses,
} from "~/server/db/schema";
import type {
	createFormSchema,
	editFormSchema,
	getDataSchema,
	getFormsSchema,
	saveExamResponsesSchema,
	saveFormResponsesSchema,
} from "../schemas/form";
import type { FormType } from "~/lib/enum";
import { eq } from "drizzle-orm";
import { bedrock as bedrockV3 } from "bedrock-v3";
import { getEvaluationExamSystemPrompt } from "~/lib/prompts/evaluation-exam";
import { generateObject } from "ai-v5";

type FormServiceContructor = {
	ctx: TRPCContext;
};

export type FormInsert = typeof forms.$inferInsert;
export type ExamInsert = typeof exams.$inferInsert;

export type CreateFormInput = {
	createFormInputSchema: z.infer<typeof createFormSchema>;
	session: Session;
};

export type EditFormInput = z.infer<typeof editFormSchema>;
export type GetFormsInput = z.infer<typeof getFormsSchema>;
export type SaveFormResponsesInput = z.infer<typeof saveFormResponsesSchema>;
export type SaveExamResponsesInput = z.infer<typeof saveExamResponsesSchema>;

export type GetDataInput = z.infer<typeof getDataSchema>;
export type Questions = typeof questionsSchema.$inferSelect & {
	questionOptions: (typeof questionOptions.$inferSelect)[];
};

export class FormService {
	ctx: TRPCContext;

	constructor({ ctx }: FormServiceContructor) {
		this.ctx = ctx;
	}

	async create(input: CreateFormInput) {
		try {
			const { createFormInputSchema, session } = input;

			const result = await this.ctx.db.transaction(async (tx) => {
				const { title, description, type, questions } =
					createFormInputSchema.formData;

				const createQuestions = async () => {
					const createdQuestionIds: string[] = [];

					for (const question of questions) {
						const [createdQuestion] = await tx
							.insert(questionsSchema)
							.values(question)
							.returning();

						if (!createdQuestion) {
							throw new TRPCError({
								code: "INTERNAL_SERVER_ERROR",
								message: "Failed to create question",
							});
						}

						if (question.options && question.options.length > 0) {
							await tx.insert(questionOptions).values(
								question.options.map((option) => ({
									questionId: createdQuestion.id,
									label: option.label,
									value: option.value,
								})),
							);
						}

						createdQuestionIds.push(createdQuestion.id);
					}

					return createdQuestionIds;
				};

				switch (type) {
					case "EXAM": {
						const [exam] = await tx
							.insert(exams)
							.values({
								title,
								instructions: description,
								userId: session.user.id,
							})
							.returning();

						if (!exam) {
							throw new TRPCError({
								code: "INTERNAL_SERVER_ERROR",
								message: "Failed to create exam",
							});
						}

						const [examVersion] = await tx
							.insert(examVersions)
							.values({
								examId: exam.id,
								version: 1,
							})
							.returning();

						if (!examVersion) {
							throw new TRPCError({
								code: "INTERNAL_SERVER_ERROR",
								message: "Failed to create exam version",
							});
						}

						const createdQuestionIds = await createQuestions();

						await tx.insert(questionsToExamVersions).values(
							createdQuestionIds.map((id) => ({
								examVersionId: examVersion.id,
								questionId: id,
							})),
						);

						return {
							data: exam,
							type: "EXAM" as FormType,
						};
					}

					case "BASIC": {
						const [form] = await tx
							.insert(forms)
							.values({
								title,
								description,
								userId: session.user.id,
							})
							.returning();

						if (!form) {
							throw new TRPCError({
								code: "INTERNAL_SERVER_ERROR",
								message: "Failed to create form",
							});
						}

						const [formVersion] = await tx
							.insert(formVersions)
							.values({
								formId: form.id,
								version: 1,
							})
							.returning();

						if (!formVersion) {
							throw new TRPCError({
								code: "INTERNAL_SERVER_ERROR",
								message: "Failed to create form version",
							});
						}

						const createdQuestionIds = await createQuestions();

						await tx.insert(questionsToFormVersions).values(
							createdQuestionIds.map((id) => ({
								formVersionId: formVersion.id,
								questionId: id,
							})),
						);

						return {
							data: form,
							type: "BASIC" as FormType,
						};
					}
					default:
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Invalid form type",
						});
				}
			});

			return result;
		} catch (e) {
			console.error(e);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to create form",
			});
		}
	}

	async getData(input: GetDataInput) {
		const { id, type } = input;

		switch (type) {
			case "BASIC": {
				const form = await this.ctx.db.query.formVersions.findFirst({
					where: (formVersions, { eq }) => {
						return eq(formVersions.formId, id);
					},
					orderBy: (formVersions, { desc }) => [desc(formVersions.version)],
					with: {
						form: true,
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
				});

				if (!form) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Form not found",
					});
				}

				return { data: form, type };
			}
			case "EXAM": {
				const exam = await this.ctx.db.query.examVersions.findFirst({
					where: (examVersions, { eq }) => {
						return eq(examVersions.examId, id);
					},
					orderBy: (examVersions, { desc }) => [desc(examVersions.version)],
					with: {
						exam: true,
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
				});

				if (!exam) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Exam not found",
					});
				}

				return { data: exam, type };
			}
			default:
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Invalid form type",
				});
		}
	}

	public async edit(input: EditFormInput) {
		const result = await this.ctx.db.transaction(async (tx) => {
			const {
				formData: { title, description, type, questions },
				id,
			} = input;

			const createQuestions = async () => {
				const createdQuestionIds: string[] = [];

				for (const question of questions) {
					const [createdQuestion] = await tx
						.insert(questionsSchema)
						.values(question)
						.returning();

					if (!createdQuestion) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to create question",
						});
					}

					if (question.options && question.options.length > 0) {
						await tx.insert(questionOptions).values(
							question.options.map((option) => ({
								questionId: createdQuestion.id,
								label: option.label,
								value: option.value,
							})),
						);
					}

					createdQuestionIds.push(createdQuestion.id);
				}

				return createdQuestionIds;
			};

			switch (type) {
				case "EXAM": {
					await tx
						.update(exams)
						.set({
							title,
							instructions: description,
						})
						.where(eq(exams.id, id));

					const queryExamVersion = await tx.query.examVersions.findFirst({
						where: (examVersions, { eq }) => {
							return eq(examVersions.examId, id);
						},
						orderBy: (examVersions, { desc }) => [desc(examVersions.version)],
					});

					if (!queryExamVersion) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Exam Version not found",
						});
					}

					const [examVersion] = await tx
						.insert(examVersions)
						.values({
							examId: id,
							version: queryExamVersion.version + 1,
						})
						.returning();

					if (!examVersion) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to create exam version",
						});
					}

					const createdQuestionIds = await createQuestions();

					await tx.insert(questionsToExamVersions).values(
						createdQuestionIds.map((id) => ({
							examVersionId: examVersion.id,
							questionId: id,
						})),
					);

					return { data: examVersion, type };
				}

				case "BASIC": {
					await tx
						.update(forms)
						.set({
							title,
							description,
						})
						.where(eq(forms.id, id));

					const queryFormVersion = await tx.query.formVersions.findFirst({
						where: (formVersions, { eq }) => {
							return eq(formVersions.formId, id);
						},
						orderBy: (formVersions, { desc }) => [desc(formVersions.version)],
					});

					if (!queryFormVersion) {
						throw new TRPCError({
							code: "NOT_FOUND",
							message: "Form Version not found",
						});
					}

					const [formVersion] = await tx
						.insert(formVersions)
						.values({
							formId: id,
							version: queryFormVersion.version + 1,
						})
						.returning();

					if (!formVersion) {
						throw new TRPCError({
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to create form version",
						});
					}

					const createdQuestionIds = await createQuestions();

					await tx.insert(questionsToFormVersions).values(
						createdQuestionIds.map((id) => ({
							formVersionId: formVersion.id,
							questionId: id,
						})),
					);

					return { data: formVersion, type };
				}
				default:
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid form type",
					});
			}
		});

		return result;
	}

	public async getForms(input: GetFormsInput, userId: string) {
		try {
			const { type, search } = input;

			switch (type) {
				case "EXAM": {
					const exams = await this.ctx.db.query.exams.findMany({
						where: (exams, { eq, and, ilike }) => {
							const conditions = [eq(exams.userId, userId)];

							if (search) {
								conditions.push(ilike(exams.title, `%${search}%`));
							}

							return and(...conditions);
						},
						orderBy: (exams, { desc }) => [desc(exams.id)],
					});

					return { data: exams, type };
				}
				case "BASIC": {
					const forms = await this.ctx.db.query.forms.findMany({
						where: (forms, { eq, and, ilike }) => {
							const conditions = [eq(forms.userId, userId)];

							if (search) {
								conditions.push(ilike(forms.title, `%${search}%`));
							}

							return and(...conditions);
						},
						orderBy: (forms, { desc }) => [desc(forms.id)],
					});

					return { data: forms, type };
				}
				default:
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Invalid form type",
					});
			}
		} catch (e) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to get forms",
			});
		}
	}

	public async saveFormResponses(input: SaveFormResponsesInput) {
		const {
			email,
			userId,
			answers,
			username,
			formId,
			formLinkId,
			formVersionId,
		} = input;

		const userResponsesExists = await this.ctx.db.query.formResponses.findFirst(
			{
				where: (formResponses, { eq, and }) =>
					and(
						eq(formResponses.email, email),
						eq(formResponses.formId, formId),
						eq(formResponses.formVersionId, formVersionId),
						eq(formResponses.formLinkId, formLinkId),
					),
			},
		);

		if (userResponsesExists) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "User has already submitted responses",
			});
		}

		const [item] = await this.ctx.db
			.insert(formResponses)
			.values({
				email,
				userId,
				username,
				formId,
				formLinkId,
				answers,
				formVersionId,
			})
			.returning();

		if (!item) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to save form responses",
			});
		}

		return item;
	}

	public async saveExamResponses(input: SaveExamResponsesInput) {
		const {
			email,
			userId,
			answers,
			username,
			examId,
			examLinkId,
			examVersionId,
		} = input;

		const userResponsesExists = await this.ctx.db.query.examResponses.findFirst(
			{
				where: (examResponses, { eq, and }) =>
					and(
						eq(examResponses.email, email),
						eq(examResponses.examId, examId),
						eq(examResponses.examVersionId, examVersionId),
						eq(examResponses.examLinkId, examLinkId),
					),
			},
		);

		if (userResponsesExists) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "User has already submitted responses",
			});
		}

		const questions = await this.ctx.db.query.questionsToExamVersions.findMany({
			where: (questionsToExamVersions, { eq }) =>
				eq(questionsToExamVersions.examVersionId, examVersionId),
			with: {
				question: true,
			},
		});

		const questionsWithCorrectAnswers = questions.map((question) => ({
			key: question.question.key,
			answer: question.question.answer,
			type: question.question.type,
			label: question.question.label,
			description: question.question.description,
		}));

		return questionsWithCorrectAnswers;
	}
}
