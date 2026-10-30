import { tool } from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/server/db";
import { classroomStudents } from "~/server/db/schema";

export const createClassroomStudentsTool = ({
	userId,
	activeClassroomId,
}: {
	userId: string;
	activeClassroomId?: string | null;
}) =>
	tool({
		description:
			"List the students enrolled in the active classroom, with their names and emails. Use it when the teacher asks who is in the classroom, or to get the emails of specific students before sharing a form or exam with them. It only covers the active classroom.",
		inputSchema: z.object({}),
		execute: async () => {
			if (!activeClassroomId) {
				return {
					status: "error",
					message:
						"No active classroom is selected. Ask the teacher to select the classroom first.",
				};
			}

			const teacher = await db.query.classroomTeachers.findFirst({
				where: (table) =>
					and(
						eq(table.classroomId, activeClassroomId),
						eq(table.userId, userId),
					),
			});

			if (!teacher) {
				return {
					status: "error",
					message:
						"The active classroom is not one you teach. Ask the teacher to select a classroom they teach.",
				};
			}

			const students = await db.query.classroomStudents.findMany({
				where: (table) => eq(table.classroomId, activeClassroomId),
				with: { student: { columns: { name: true } } },
				orderBy: (table, { asc }) => [asc(table.email)],
			});

			return {
				status: "ok",
				count: students.length,
				students: students.map((row) => ({
					name: row.student?.name ?? null,
					email: row.email,
				})),
			};
		},
	});
