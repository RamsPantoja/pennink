import type { z } from "zod";
import type { TRPCContext } from "../trpc";
import type { Session } from "next-auth";
import { TRPCError } from "@trpc/server";
import {
	forms,
	exams,
	questions as questionsSchema,
	questionsToExams,
} from "~/server/db/schema";
import type { createFormSchema } from "../schemas/form";

type FormServiceContructor = {
	ctx: TRPCContext;
};

export type FormInsert = typeof forms.$inferInsert;
export type ExamInsert = typeof exams.$inferInsert;

export type CreateFormInput = {
	createFormInputSchema: z.infer<typeof createFormSchema>;
	session: Session;
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

						const createdQuestions = await tx
							.insert(questionsSchema)
							.values(questions)
							.returning();

						await tx.insert(questionsToExams).values(
							createdQuestions.map((question) => ({
								examId: exam.id,
								questionId: question.id,
							})),
						);

						return exam;
					}

					case "BASIC": {
						// const form = await tx.insert(forms).values();
						// return form;
					}
					default:
						throw new TRPCError({
							code: "BAD_REQUEST",
							message: "Invalid form type",
						});
				}
			});
		} catch (e) {
			console.error(e);
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Failed to create form",
			});
		}
	}
}
