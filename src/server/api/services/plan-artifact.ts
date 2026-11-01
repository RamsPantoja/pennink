import type { Block } from "@blocknote/core";
import { TRPCError } from "@trpc/server";
import { and, asc, desc, eq, gte, inArray, isNull, lte } from "drizzle-orm";
import {
	classroomTeachers,
	classrooms,
	planArtifacts,
	studyPlanClassrooms,
	studyPlanItems,
	studyPlanProgress,
	studyPlans,
} from "~/server/db/schema";
import type { TRPCContext } from "../../trpc";
import type {
	createPlanArtifactInputSchema,
	updatePlanArtifactInputSchema,
} from "../schemas/plan-artifact";
import type { z } from "zod";

type CreateInput = z.infer<typeof createPlanArtifactInputSchema>;
type UpdateInput = z.infer<typeof updatePlanArtifactInputSchema>;

export type StudyPlanContextItem = {
	dueDate: string;
	planTitle: string;
	title: string;
	parentTitle: string | null;
	completed: boolean;
};

/**
 * Markdown plans for one day or week of a classroom. Access follows the classroom:
 * any teacher of the classroom can read, edit and create its plans.
 */
export class PlanArtifactService {
	constructor(private readonly ctx: Pick<TRPCContext, "db">) {}

	public async listAll(userId: string) {
		const teachable = await this.teachableClassroomIds(userId);
		if (teachable.length === 0) return [];

		return this.ctx.db
			.select({
				id: planArtifacts.id,
				title: planArtifacts.title,
				range: planArtifacts.range,
				startDate: planArtifacts.startDate,
				endDate: planArtifacts.endDate,
				updatedAt: planArtifacts.updatedAt,
				classroomId: planArtifacts.classroomId,
				classroomName: classrooms.name,
			})
			.from(planArtifacts)
			.innerJoin(classrooms, eq(classrooms.id, planArtifacts.classroomId))
			.where(
				and(
					inArray(planArtifacts.classroomId, teachable),
					isNull(planArtifacts.deletedAt),
				),
			)
			.orderBy(desc(planArtifacts.startDate), desc(planArtifacts.updatedAt));
	}

	public async getById(id: string, userId: string) {
		const plan = await this.findActive(id);
		await this.assertTeacher(plan.classroomId, userId);

		const [classroom] = await this.ctx.db
			.select({ name: classrooms.name })
			.from(classrooms)
			.where(eq(classrooms.id, plan.classroomId))
			.limit(1);

		return { ...plan, classroomName: classroom?.name ?? "" };
	}

	public async create(input: CreateInput, userId: string) {
		await this.assertTeacher(input.classroomId, userId);

		const [plan] = await this.ctx.db
			.insert(planArtifacts)
			.values({
				userId,
				classroomId: input.classroomId,
				title: input.title,
				range: input.range,
				startDate: input.startDate,
				endDate: input.endDate,
				content: input.content,
			})
			.returning({ id: planArtifacts.id });

		if (!plan) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Could not save the plan",
			});
		}

		return plan;
	}

	public async update(input: UpdateInput, userId: string) {
		const plan = await this.findActive(input.id);
		await this.assertTeacher(plan.classroomId, userId);

		const dates = this.resolveDates(plan, input);

		await this.ctx.db
			.update(planArtifacts)
			.set({
				title: input.title,
				content: input.content,
				blocks: input.blocks as Block[] | undefined,
				...dates,
				updatedAt: new Date(),
			})
			.where(eq(planArtifacts.id, input.id));

		return { id: input.id };
	}

	/**
	 * Study plan items of the classroom whose due date falls in the range, across every
	 * attached plan. `completed` is the classroom's progress for that item.
	 */
	public async loadContext(
		input: { classroomId: string; startDate: string; endDate: string },
		userId: string,
	): Promise<StudyPlanContextItem[]> {
		await this.assertTeacher(input.classroomId, userId);

		const rows = await this.ctx.db
			.select({
				planId: studyPlans.id,
				planTitle: studyPlans.title,
				position: studyPlanItems.position,
				parentPosition: studyPlanItems.parentPosition,
				title: studyPlanItems.title,
				dueDate: studyPlanItems.dueDate,
				completed: studyPlanProgress.completed,
			})
			.from(studyPlanItems)
			.innerJoin(studyPlans, eq(studyPlans.id, studyPlanItems.studyPlanId))
			.innerJoin(
				studyPlanClassrooms,
				and(
					eq(studyPlanClassrooms.studyPlanId, studyPlans.id),
					eq(studyPlanClassrooms.classroomId, input.classroomId),
				),
			)
			.leftJoin(
				studyPlanProgress,
				and(
					eq(studyPlanProgress.studyPlanId, studyPlans.id),
					eq(studyPlanProgress.classroomId, input.classroomId),
					eq(studyPlanProgress.position, studyPlanItems.position),
				),
			)
			.where(
				and(
					isNull(studyPlans.deletedAt),
					gte(studyPlanItems.dueDate, input.startDate),
					lte(studyPlanItems.dueDate, input.endDate),
				),
			)
			.orderBy(
				asc(studyPlanItems.dueDate),
				asc(studyPlans.title),
				asc(studyPlanItems.position),
			);

		if (rows.length === 0) return [];

		const planIds = [...new Set(rows.map((row) => row.planId))];
		const parents = await this.ctx.db
			.select({
				planId: studyPlanItems.studyPlanId,
				position: studyPlanItems.position,
				title: studyPlanItems.title,
			})
			.from(studyPlanItems)
			.where(
				and(
					inArray(studyPlanItems.studyPlanId, planIds),
					isNull(studyPlanItems.parentPosition),
				),
			);
		const parentTitles = new Map(
			parents.map((parent) => [
				`${parent.planId}:${parent.position}`,
				parent.title,
			]),
		);

		return rows.map((row) => ({
			dueDate: row.dueDate ?? "",
			planTitle: row.planTitle,
			title: row.title,
			parentTitle:
				row.parentPosition === null
					? null
					: (parentTitles.get(`${row.planId}:${row.parentPosition}`) ?? null),
			completed: row.completed ?? false,
		}));
	}

	/**
	 * Range and dates to store. Returns nothing when the input leaves them alone.
	 * A day plan always ends on its start date.
	 */
	private resolveDates(
		plan: { range: "day" | "week"; startDate: string; endDate: string },
		input: UpdateInput,
	) {
		if (
			input.range === undefined &&
			input.startDate === undefined &&
			input.endDate === undefined
		) {
			return {};
		}

		const range = input.range ?? plan.range;
		const startDate = input.startDate ?? plan.startDate;
		const endDate =
			range === "day" ? startDate : (input.endDate ?? plan.endDate);

		if (endDate < startDate) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "End date must be on or after the start date",
			});
		}

		return { range, startDate, endDate };
	}

	private async findActive(id: string) {
		const plan = await this.ctx.db.query.planArtifacts.findFirst({
			where: (table, { and, eq, isNull }) =>
				and(eq(table.id, id), isNull(table.deletedAt)),
		});
		if (!plan) throw this.notFound();
		return plan;
	}

	private async teachableClassroomIds(userId: string) {
		const rows = await this.ctx.db
			.select({ classroomId: classroomTeachers.classroomId })
			.from(classroomTeachers)
			.where(eq(classroomTeachers.userId, userId));

		return rows.map((row) => row.classroomId);
	}

	private async assertTeacher(classroomId: string, userId: string) {
		const teacher = await this.ctx.db.query.classroomTeachers.findFirst({
			where: (table, { eq, and }) =>
				and(eq(table.classroomId, classroomId), eq(table.userId, userId)),
		});
		if (!teacher) throw this.notFound("Classroom not found");
	}

	private notFound(message = "Plan not found") {
		return new TRPCError({ code: "NOT_FOUND", message });
	}
}
