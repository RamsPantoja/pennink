import type { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, count, eq, isNull } from "drizzle-orm";
import {
	classroomStudents,
	classroomTeachers,
	classrooms,
	students,
} from "~/server/db/schema";
import type { TRPCContext } from "../../trpc";
import type {
	classroomByIdInputSchema,
	classroomTeacherInputSchema,
	addClassroomTeacherInputSchema,
	createClassroomInputSchema,
	createStudentInputSchema,
	deleteStudentInputSchema,
	importStudentsInputSchema,
	parseStudentImportInputSchema,
	updateClassroomNameInputSchema,
	updateStudentInputSchema,
} from "../schemas/classroom";
import {
	classifyStudentRows,
	parseStudentsWorkbook,
} from "./classroom-import";

type CreateClassroomInput = z.infer<typeof createClassroomInputSchema>;
type UpdateClassroomInput = z.infer<typeof updateClassroomNameInputSchema>;
type TeacherInput = z.infer<typeof classroomTeacherInputSchema>;
type AddTeacherInput = z.infer<typeof addClassroomTeacherInputSchema>;
type CreateStudentInput = z.infer<typeof createStudentInputSchema>;
type UpdateStudentInput = z.infer<typeof updateStudentInputSchema>;
type DeleteStudentInput = z.infer<typeof deleteStudentInputSchema>;
type PreviewStudentImportInput = z.infer<typeof parseStudentImportInputSchema>;
type ImportStudentsInput = z.infer<typeof importStudentsInputSchema>;

export class ClassroomService {
	constructor(private readonly ctx: TRPCContext) {}

	public async getClassrooms(userId: string) {
		return this.ctx.db
			.select({
				id: classrooms.id,
				name: classrooms.name,
				createdAt: classrooms.createdAt,
				updatedAt: classrooms.updatedAt,
			})
			.from(classrooms)
			.innerJoin(
				classroomTeachers,
				eq(classroomTeachers.classroomId, classrooms.id),
			)
			.where(
				and(eq(classroomTeachers.userId, userId), isNull(classrooms.deletedAt)),
			)
			.orderBy(classrooms.updatedAt);
	}

	public async getClassroomById(id: string, userId: string) {
		await this.assertTeacher(id, userId);
		const classroom = await this.ctx.db.query.classrooms.findFirst({
			where: (table, { eq, and, isNull }) =>
				and(eq(table.id, id), isNull(table.deletedAt)),
			with: {
				teachers: { with: { user: true } },
				students: { with: { student: true } },
				workspaces: {
					where: (table, { isNull }) => isNull(table.deletedAt),
				},
			},
		});

		if (!classroom) throw this.notFound();
		return classroom;
	}

	public async create(input: CreateClassroomInput, userId: string) {
		return this.ctx.db.transaction(async (tx) => {
			const [classroom] = await tx.insert(classrooms).values(input).returning();
			if (!classroom) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
			await tx.insert(classroomTeachers).values({
				classroomId: classroom.id,
				userId,
			});
			return classroom;
		});
	}

	public async updateName(input: UpdateClassroomInput, userId: string) {
		await this.assertTeacher(input.id, userId);
		const [classroom] = await this.ctx.db
			.update(classrooms)
			.set({ name: input.name, updatedAt: new Date() })
			.where(eq(classrooms.id, input.id))
			.returning();
		if (!classroom) throw this.notFound();
		return classroom;
	}

	public async delete(id: string, userId: string) {
		await this.assertTeacher(id, userId);
		const [classroom] = await this.ctx.db
			.update(classrooms)
			.set({ deletedAt: new Date(), updatedAt: new Date() })
			.where(eq(classrooms.id, id))
			.returning();
		if (!classroom) throw this.notFound();
		return classroom;
	}

	public async addTeacher(input: AddTeacherInput, userId: string) {
		await this.assertTeacher(input.classroomId, userId);
		const teacher = await this.ctx.db.query.users.findFirst({
			where: (table, { eq }) => eq(table.email, input.email.toLowerCase()),
		});
		if (!teacher) throw this.notFound("Teacher not found");
		await this.ctx.db
			.insert(classroomTeachers)
			.values({ classroomId: input.classroomId, userId: teacher.id })
			.onConflictDoNothing();
		return this.getClassroomById(input.classroomId, userId);
	}

	public async removeTeacher(input: TeacherInput, userId: string) {
		await this.assertTeacher(input.classroomId, userId);
		const [{ total } = { total: 0 }] = await this.ctx.db
			.select({ total: count() })
			.from(classroomTeachers)
			.where(eq(classroomTeachers.classroomId, input.classroomId));
		if (total <= 1) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "A classroom must have at least one teacher",
			});
		}
		await this.ctx.db
			.delete(classroomTeachers)
			.where(
				and(
					eq(classroomTeachers.classroomId, input.classroomId),
					eq(classroomTeachers.userId, input.userId),
				),
			);
		return this.getClassroomById(input.classroomId, userId);
	}

	public async createStudent(input: CreateStudentInput, userId: string) {
		await this.assertTeacher(input.classroomId, userId);
		const email = input.email.toLowerCase();
		return this.ctx.db.transaction(async (tx) => {
			const [student] = await tx
				.insert(students)
				.values({ name: input.name, email, phone: input.phone })
				.returning();
			if (!student) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
			await tx.insert(classroomStudents).values({
				classroomId: input.classroomId,
				studentId: student.id,
				email,
			});
			return student;
		});
	}

	public async updateStudent(input: UpdateStudentInput, userId: string) {
		await this.assertTeacher(input.classroomId, userId);
		const email = input.email.toLowerCase();
		const [membership] = await this.ctx.db
			.select()
			.from(classroomStudents)
			.where(
				and(
					eq(classroomStudents.classroomId, input.classroomId),
					eq(classroomStudents.studentId, input.studentId),
				),
			);
		if (!membership) throw this.notFound("Student not found");
		const [student] = await this.ctx.db
			.update(students)
			.set({
				name: input.name,
				email,
				phone: input.phone,
				updatedAt: new Date(),
			})
			.where(eq(students.id, input.studentId))
			.returning();
		await this.ctx.db
			.update(classroomStudents)
			.set({ email })
			.where(
				and(
					eq(classroomStudents.classroomId, input.classroomId),
					eq(classroomStudents.studentId, input.studentId),
				),
			);
		if (!student) throw this.notFound("Student not found");
		return student;
	}

	public async deleteStudent(input: DeleteStudentInput, userId: string) {
		await this.assertTeacher(input.classroomId, userId);
		await this.ctx.db
			.delete(classroomStudents)
			.where(
				and(
					eq(classroomStudents.classroomId, input.classroomId),
					eq(classroomStudents.studentId, input.studentId),
				),
			);
		return { id: input.studentId };
	}

	public async previewStudentImport(
		input: PreviewStudentImportInput,
		userId: string,
	) {
		await this.assertTeacher(input.classroomId, userId);
		const parsed = await parseStudentsWorkbook(
			Buffer.from(input.fileBase64, "base64"),
		);
		if (!parsed.ok) {
			throw new TRPCError({ code: "BAD_REQUEST", message: parsed.message });
		}
		const rows = await classifyStudentRows(
			this.ctx.db,
			input.classroomId,
			parsed.rows,
		);
		return { rows };
	}

	public async importStudents(input: ImportStudentsInput, userId: string) {
		await this.assertTeacher(input.classroomId, userId);
		const uniqueRows = [
			...new Map(
				input.rows.map((row) => [row.email.toLowerCase(), row]),
			).values(),
		];

		return this.ctx.db.transaction(async (tx) => {
			const summary = { created: 0, linked: 0, skipped: 0 };
			for (const row of uniqueRows) {
				const email = row.email.toLowerCase();
				const [existing] = await tx
					.select({ id: students.id })
					.from(students)
					.where(eq(students.email, email))
					.limit(1);

				let studentId = existing?.id;
				if (!studentId) {
					const [student] = await tx
						.insert(students)
						.values({ name: row.name, email, phone: row.phone })
						.returning({ id: students.id });
					if (!student) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
					studentId = student.id;
				} else if (row.phone) {
					await tx
						.update(students)
						.set({ phone: row.phone, updatedAt: new Date() })
						.where(eq(students.id, studentId));
				}

				const enrolled = await tx
					.insert(classroomStudents)
					.values({ classroomId: input.classroomId, studentId, email })
					.onConflictDoNothing()
					.returning({ studentId: classroomStudents.studentId });

				if (enrolled.length === 0) summary.skipped++;
				else if (existing) summary.linked++;
				else summary.created++;
			}
			return summary;
		});
	}

	private async assertTeacher(classroomId: string, userId: string) {
		const teacher = await this.ctx.db.query.classroomTeachers.findFirst({
			where: (table, { eq }) =>
				and(eq(table.classroomId, classroomId), eq(table.userId, userId)),
		});
		if (!teacher) throw this.notFound("Classroom not found");
	}

	private notFound(message = "Classroom not found") {
		return new TRPCError({ code: "NOT_FOUND", message });
	}
}

export const userHasClassroom = async (
	db: TRPCContext["db"],
	userId: string,
) => {
	const [classroom] = await db
		.select({ id: classrooms.id })
		.from(classrooms)
		.innerJoin(
			classroomTeachers,
			eq(classroomTeachers.classroomId, classrooms.id),
		)
		.where(
			and(eq(classroomTeachers.userId, userId), isNull(classrooms.deletedAt)),
		)
		.limit(1);

	return !!classroom;
};
