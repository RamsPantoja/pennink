import type { z } from "zod";
import type { TRPCContext } from "../../trpc";
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
	examResults,
	formLinks,
	examLinks,
	classroomStudents,
	classroomTeachers,
	users,
} from "~/server/db/schema";
import type {
	createFormSchema,
	editFormSchema,
	getDataSchema,
	getExamResultsSchema,
	getFormResponsesSchema,
	getFormsSchema,
	deleteFormSchema,
	submitExamSchema,
	saveFormResponsesSchema,
} from "../schemas/form";
import {
	calculateExamScore,
	gradeQuestion,
} from "~/app/agents/exam-evaluation/grade";
import type { FormType } from "~/lib/enum";
import { and, eq, inArray, sql } from "drizzle-orm";

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
export type SubmitExamInput = z.infer<typeof submitExamSchema>;
export type GetExamResultsInput = z.infer<typeof getExamResultsSchema>;
export type GetFormResponsesInput = z.infer<typeof getFormResponsesSchema>;

export type GetDataInput = z.infer<typeof getDataSchema>;
export type DeleteFormInput = z.infer<typeof deleteFormSchema>;
type Transaction = Parameters<Parameters<TRPCContext["db"]["transaction"]>[0]>[0];
export type Questions = typeof questionsSchema.$inferSelect & {
	questionOptions: (typeof questionOptions.$inferSelect)[];
};

export class FormService {
	ctx: TRPCContext;

	constructor({ ctx }: FormServiceContructor) {
		this.ctx = ctx;
	}

	public async create(input: CreateFormInput) {
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

	public async getData(input: GetDataInput) {
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

	// No foreign key cascades exist on these tables, so dependents are removed child first.
	public async delete(input: DeleteFormInput, userId: string) {
		const { id, type } = input;

		await this.ctx.db.transaction(async (tx) => {
			if (type === "BASIC") {
				await this.deleteForm(tx, id, userId);
			} else {
				await this.deleteExam(tx, id, userId);
			}
		});

		return { id, type };
	}

	private async deleteForm(tx: Transaction, id: string, userId: string) {
		const form = await tx.query.forms.findFirst({
			columns: { id: true },
			where: (forms, { and, eq }) =>
				and(eq(forms.id, id), eq(forms.userId, userId)),
		});

		if (!form) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Form not found" });
		}

		const versions = await tx
			.select({ id: formVersions.id })
			.from(formVersions)
			.where(eq(formVersions.formId, id));
		const versionIds = versions.map((version) => version.id);

		const usedQuestions = await tx
			.select({ questionId: questionsToFormVersions.questionId })
			.from(questionsToFormVersions)
			.where(inArray(questionsToFormVersions.formVersionId, versionIds));
		const questionIds = [...new Set(usedQuestions.map((q) => q.questionId))];

		await tx.delete(formResponses).where(eq(formResponses.formId, id));
		await tx
			.delete(formLinks)
			.where(inArray(formLinks.formVersionId, versionIds));
		await tx
			.delete(questionsToFormVersions)
			.where(inArray(questionsToFormVersions.formVersionId, versionIds));
		await tx.delete(formVersions).where(eq(formVersions.formId, id));
		await this.deleteUnusedQuestions(tx, questionIds);
		await tx.delete(forms).where(eq(forms.id, id));
	}

	private async deleteExam(tx: Transaction, id: string, userId: string) {
		const exam = await tx.query.exams.findFirst({
			columns: { id: true },
			where: (exams, { and, eq }) =>
				and(eq(exams.id, id), eq(exams.userId, userId)),
		});

		if (!exam) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Exam not found" });
		}

		const versions = await tx
			.select({ id: examVersions.id })
			.from(examVersions)
			.where(eq(examVersions.examId, id));
		const versionIds = versions.map((version) => version.id);

		const usedQuestions = await tx
			.select({ questionId: questionsToExamVersions.questionId })
			.from(questionsToExamVersions)
			.where(inArray(questionsToExamVersions.examVersionId, versionIds));
		const questionIds = [...new Set(usedQuestions.map((q) => q.questionId))];

		await tx.delete(examResults).where(eq(examResults.examId, id));
		await tx
			.delete(examLinks)
			.where(inArray(examLinks.examVersionId, versionIds));
		await tx
			.delete(questionsToExamVersions)
			.where(inArray(questionsToExamVersions.examVersionId, versionIds));
		await tx.delete(examVersions).where(eq(examVersions.examId, id));
		await this.deleteUnusedQuestions(tx, questionIds);
		await tx.delete(exams).where(eq(exams.id, id));
	}

	// A question can be shared by several versions, so only remove the ones nothing else references.
	private async deleteUnusedQuestions(tx: Transaction, questionIds: string[]) {
		if (questionIds.length === 0) return;

		const inFormVersions = await tx
			.select({ questionId: questionsToFormVersions.questionId })
			.from(questionsToFormVersions)
			.where(inArray(questionsToFormVersions.questionId, questionIds));
		const inExamVersions = await tx
			.select({ questionId: questionsToExamVersions.questionId })
			.from(questionsToExamVersions)
			.where(inArray(questionsToExamVersions.questionId, questionIds));

		const stillUsed = new Set([
			...inFormVersions.map((row) => row.questionId),
			...inExamVersions.map((row) => row.questionId),
		]);
		const unused = questionIds.filter((questionId) => !stillUsed.has(questionId));

		if (unused.length === 0) return;

		await tx
			.delete(questionOptions)
			.where(inArray(questionOptions.questionId, unused));
		await tx.delete(questionsSchema).where(inArray(questionsSchema.id, unused));
	}

	private async assertLinkClassroomMember(classroomId: string, email: string) {
		const normalizedEmail = email.trim().toLowerCase();

		const [student] = await this.ctx.db
			.select({ studentId: classroomStudents.studentId })
			.from(classroomStudents)
			.where(
				and(
					eq(classroomStudents.classroomId, classroomId),
					sql`lower(${classroomStudents.email}) = ${normalizedEmail}`,
				),
			)
			.limit(1);

		if (student) return;

		const [teacher] = await this.ctx.db
			.select({ userId: classroomTeachers.userId })
			.from(classroomTeachers)
			.innerJoin(users, eq(users.id, classroomTeachers.userId))
			.where(
				and(
					eq(classroomTeachers.classroomId, classroomId),
					sql`lower(${users.email}) = ${normalizedEmail}`,
				),
			)
			.limit(1);

		if (!teacher) {
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "This email is not part of the classroom for this link",
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

		const formLink = await this.ctx.db.query.formLinks.findFirst({
			where: (formLinks, { eq }) => eq(formLinks.id, formLinkId),
			columns: { classroomId: true },
		});

		if (!formLink) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Link not found",
			});
		}

		await this.assertLinkClassroomMember(formLink.classroomId, email);

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

	public async submitExam(input: SubmitExamInput) {
		const { email, userId, username, examLinkId, answers } = input;

		const examLink = await this.ctx.db.query.examLinks.findFirst({
			where: (examLinks, { eq }) => eq(examLinks.id, examLinkId),
			with: {
				examVersion: {
					with: {
						questionsToExamVersions: {
							with: { question: true },
						},
					},
				},
			},
		});

		if (!examLink) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Link not found",
			});
		}

		await this.assertLinkClassroomMember(examLink.classroomId, email);

		// Objective questions are graded here; open questions stay "pending" for the AI.
		const questionResults =
			examLink.examVersion.questionsToExamVersions.map(({ question }) =>
				gradeQuestion(question, answers[question.key]),
			);

		const [examResult] = await this.ctx.db
			.insert(examResults)
			.values({
				email,
				userId,
				username,
				answers,
				examId: examLink.examVersion.examId,
				examLinkId,
				examVersionId: examLink.examVersionId,
				score: calculateExamScore(questionResults),
				feedback: "",
				questionResults,
			})
			.onConflictDoNothing({
				target: [
					examResults.examLinkId,
					examResults.email,
					examResults.examVersionId,
				],
			})
			.returning({ id: examResults.id });

		if (!examResult) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "User has already submitted responses",
			});
		}

		return {
			examResultId: examResult.id,
			hasPendingQuestions: questionResults.some(
				(item) => item.status === "pending",
			),
		};
	}

	// Public review shown to the student after submitting. It omits the email.
	public async getExamReview(examResultId: string) {
		const examResult = await this.ctx.db.query.examResults.findFirst({
			where: (examResults, { eq }) => eq(examResults.id, examResultId),
			columns: {
				id: true,
				score: true,
				feedback: true,
				answers: true,
				questionResults: true,
			},
			with: {
				exam: {
					columns: {
						title: true,
						instructions: true,
					},
				},
				examVersion: {
					with: {
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

		if (!examResult) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Exam result not found",
			});
		}

		return examResult;
	}

	public async getExamResults(input: GetExamResultsInput) {
		const { examLinkId } = input;

		const examResults = await this.ctx.db.query.examResults.findMany({
			where: (examResults, { eq }) => eq(examResults.examLinkId, examLinkId),
		});

		return examResults;
	}

	public async getFormResponses(input: GetFormResponsesInput) {
		const { formLinkId } = input;

		const formResponses = await this.ctx.db.query.formResponses.findMany({
			where: (formResponses, { eq }) =>
				eq(formResponses.formLinkId, formLinkId),
		});

		return formResponses;
	}

	public async getFormResponse(formResponseId: string) {
		const formResponse = await this.ctx.db.query.formResponses.findFirst({
			where: (formResponses, { eq }) => eq(formResponses.id, formResponseId),
			with: {
				form: {
					columns: {
						title: true,
						description: true,
					},
				},
				formVersion: {
					with: {
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

		if (!formResponse) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Form response not found",
			});
		}

		return formResponse;
	}

	public async getExamResult(examResultId: string) {
		const examResult = await this.ctx.db.query.examResults.findFirst({
			where: (examResults, { eq }) => eq(examResults.id, examResultId),
			with: {
				exam: {
					columns: {
						title: true,
						instructions: true,
					},
				},
				examVersion: {
					with: {
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

		if (!examResult) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Exam result not found",
			});
		}

		return examResult;
	}
}
