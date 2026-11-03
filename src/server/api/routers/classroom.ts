import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import {
	classroomByIdInputSchema,
	addClassroomTeacherInputSchema,
	classroomTeacherInputSchema,
	createClassroomInputSchema,
	createStudentInputSchema,
	deleteClassroomInputSchema,
	deleteStudentInputSchema,
	importStudentsInputSchema,
	parseStudentImportInputSchema,
	updateClassroomNameInputSchema,
	updateStudentInputSchema,
} from "../schemas/classroom";

export const classroomRouter = createTRPCRouter({
	classrooms: protectedProcedure.query(({ ctx }) =>
		ctx.services({ ctx }).classroomService.getClassrooms(ctx.session.user.id),
	),
	classroomById: protectedProcedure
		.input(classroomByIdInputSchema)
		.query(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.classroomService.getClassroomById(input.id, ctx.session.user.id),
		),
	create: protectedProcedure
		.input(createClassroomInputSchema)
		.mutation(({ input, ctx }) =>
			ctx.services({ ctx }).classroomService.create(input, ctx.session.user.id),
		),
	updateName: protectedProcedure
		.input(updateClassroomNameInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.classroomService.updateName(input, ctx.session.user.id),
		),
	delete: protectedProcedure
		.input(deleteClassroomInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.classroomService.delete(input.id, ctx.session.user.id),
		),
	addTeacher: protectedProcedure
		.input(addClassroomTeacherInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.classroomService.addTeacher(input, ctx.session.user.id),
		),
	removeTeacher: protectedProcedure
		.input(classroomTeacherInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.classroomService.removeTeacher(input, ctx.session.user.id),
		),
	createStudent: protectedProcedure
		.input(createStudentInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.classroomService.createStudent(input, ctx.session.user.id),
		),
	updateStudent: protectedProcedure
		.input(updateStudentInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.classroomService.updateStudent(input, ctx.session.user.id),
		),
	deleteStudent: protectedProcedure
		.input(deleteStudentInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.classroomService.deleteStudent(input, ctx.session.user.id),
		),
	previewStudentImport: protectedProcedure
		.input(parseStudentImportInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.classroomService.previewStudentImport(input, ctx.session.user.id),
		),
	importStudents: protectedProcedure
		.input(importStudentsInputSchema)
		.mutation(({ input, ctx }) =>
			ctx
				.services({ ctx })
				.classroomService.importStudents(input, ctx.session.user.id),
		),
});
