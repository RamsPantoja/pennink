import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import {
	createStudyPlanInputSchema,
	importStudyPlanInputSchema,
	listStudyPlansInputSchema,
	setStudyPlanItemInputSchema,
	studyPlanByIdInputSchema,
	studyPlanViewInputSchema,
	studyPlanClassroomInputSchema,
	updateStudyPlanInputSchema,
} from "../schemas/study-plan";

export const studyPlanRouter = createTRPCRouter({
	listForClassroom: protectedProcedure
		.input(listStudyPlansInputSchema)
		.query(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.studyPlanService.listForClassroom(input.classroomId, ctx.session.user.id),
		),
	listAll: protectedProcedure.query(({ ctx }) =>
		ctx.services({ ctx }).studyPlanService.listAll(ctx.session.user.id),
	),
	byId: protectedProcedure
		.input(studyPlanViewInputSchema)
		.query(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.studyPlanService.getById(input, ctx.session.user.id),
		),
	create: protectedProcedure
		.input(createStudyPlanInputSchema)
		.mutation(({ input, ctx }) =>
			ctx.services({ ctx }).studyPlanService.create(input, ctx.session.user.id),
		),
	update: protectedProcedure
		.input(updateStudyPlanInputSchema)
		.mutation(({ input, ctx }) =>
			ctx.services({ ctx }).studyPlanService.update(input, ctx.session.user.id),
		),
	importMarkdown: protectedProcedure
		.input(importStudyPlanInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.studyPlanService.importMarkdown(input, ctx.session.user.id),
		),
	exportMarkdown: protectedProcedure
		.input(studyPlanViewInputSchema)
		.query(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.studyPlanService.exportMarkdown(input, ctx.session.user.id),
		),
	setItemCompleted: protectedProcedure
		.input(setStudyPlanItemInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.studyPlanService.setItemCompleted(input, ctx.session.user.id, "teacher"),
		),
	attachToClassroom: protectedProcedure
		.input(studyPlanClassroomInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.studyPlanService.attachToClassroom(input, ctx.session.user.id),
		),
	detachFromClassroom: protectedProcedure
		.input(studyPlanClassroomInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.studyPlanService.detachFromClassroom(input, ctx.session.user.id),
		),
	delete: protectedProcedure
		.input(studyPlanByIdInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.studyPlanService.delete(input.id, ctx.session.user.id),
		),
});
