import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import {
	createEvaluationRunInputSchema,
	createEvaluationSubmissionInputSchema,
	evaluationRunByIdInputSchema,
	exportEvaluationRunInputSchema,
	gradeEvaluationSubmissionInputSchema,
	listEvaluationRunsInputSchema,
	overrideEvaluationAnswerInputSchema,
} from "../schemas/evaluation-run";

export const evaluationRunRouter = createTRPCRouter({
	list: protectedProcedure
		.input(listEvaluationRunsInputSchema)
		.query(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.evaluationRunService.list(input, ctx.session.user.id),
		),
	byId: protectedProcedure
		.input(evaluationRunByIdInputSchema)
		.query(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.evaluationRunService.getById(input.id, ctx.session.user.id),
		),
	create: protectedProcedure
		.input(createEvaluationRunInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.evaluationRunService.create(input, ctx.session.user.id),
		),
	createSubmission: protectedProcedure
		.input(createEvaluationSubmissionInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.evaluationRunService.createSubmission(input, ctx.session.user.id),
		),
	grade: protectedProcedure
		.input(gradeEvaluationSubmissionInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.evaluationRunService.grade(input.id, ctx.session.user.id),
		),
	overrideAnswer: protectedProcedure
		.input(overrideEvaluationAnswerInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.evaluationRunService.overrideAnswer(input, ctx.session.user.id),
		),
	exportCsv: protectedProcedure
		.input(exportEvaluationRunInputSchema)
		.query(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.evaluationRunService.exportCsv(input.runId, ctx.session.user.id),
		),
});
