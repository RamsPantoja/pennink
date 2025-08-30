import type { z } from "zod";
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
} from "~/server/db/schema";
import type { createFormSchema, getDataSchema } from "../schemas/form";
import type { FormType } from "~/lib/enum";

type FormServiceContructor = {
	ctx: TRPCContext;
};

export type FormInsert = typeof forms.$inferInsert;
export type ExamInsert = typeof exams.$inferInsert;

export type CreateFormInput = {
	createFormInputSchema: z.infer<typeof createFormSchema>;
	session: Session;
};

export type GetDataInput = z.infer<typeof getDataSchema>;

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

						if (question.options) {
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
								answers: questions.reduce(
									(acc, question) => {
										acc[question.key] = question.answer;
										return acc;
									},
									{} as Record<string, unknown>,
								),
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
}
