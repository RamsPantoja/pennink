import type { Block } from "@blocknote/core";
import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import {
	classroomTeachers,
	classrooms,
	planArtifacts,
	planArtifactsToWorkspaces,
} from "~/server/db/schema";
import type { TRPCContext } from "../../trpc";
import type {
	createPlanArtifactInputSchema,
	updatePlanArtifactInputSchema,
	workspacePlanArtifactInputSchema,
	workspacePlanArtifactsInputSchema,
} from "../schemas/plan-artifact";
import type { z } from "zod";

type CreateInput = z.infer<typeof createPlanArtifactInputSchema>;
type UpdateInput = z.infer<typeof updatePlanArtifactInputSchema>;
type WorkspacePlanArtifactInput = z.infer<
	typeof workspacePlanArtifactInputSchema
>;
type WorkspacePlanArtifactsInput = z.infer<
	typeof workspacePlanArtifactsInputSchema
>;

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
	 * Lesson plans the teacher attached to a workspace. Only active plans are listed.
	 */
	public async listForWorkspace(
		input: WorkspacePlanArtifactsInput,
		userId: string,
	) {
		const workspace = await this.findWorkspace(input.workspaceId);
		await this.assertTeacher(workspace.classroomId, userId);

		return this.ctx.db
			.select({
				id: planArtifacts.id,
				title: planArtifacts.title,
				range: planArtifacts.range,
				startDate: planArtifacts.startDate,
				endDate: planArtifacts.endDate,
				updatedAt: planArtifacts.updatedAt,
			})
			.from(planArtifactsToWorkspaces)
			.innerJoin(
				planArtifacts,
				eq(planArtifacts.id, planArtifactsToWorkspaces.planArtifactId),
			)
			.where(
				and(
					eq(planArtifactsToWorkspaces.workspaceId, input.workspaceId),
					isNull(planArtifacts.deletedAt),
				),
			)
			.orderBy(desc(planArtifacts.startDate), desc(planArtifacts.updatedAt));
	}

	/**
	 * A lesson plan can only be used in a workspace of its own classroom.
	 */
	public async attachToWorkspace(
		input: WorkspacePlanArtifactInput,
		userId: string,
	) {
		const workspace = await this.findWorkspace(input.workspaceId);
		await this.assertTeacher(workspace.classroomId, userId);

		const plan = await this.findActive(input.planArtifactId);
		if (plan.classroomId !== workspace.classroomId) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "The lesson plan belongs to another classroom",
			});
		}

		await this.ctx.db
			.insert(planArtifactsToWorkspaces)
			.values({
				planArtifactId: input.planArtifactId,
				workspaceId: input.workspaceId,
			})
			.onConflictDoNothing();

		return { id: input.planArtifactId };
	}

	/**
	 * Removes only the link. The lesson plan itself is kept.
	 */
	public async detachFromWorkspace(
		input: WorkspacePlanArtifactInput,
		userId: string,
	) {
		const workspace = await this.findWorkspace(input.workspaceId);
		await this.assertTeacher(workspace.classroomId, userId);

		await this.ctx.db
			.delete(planArtifactsToWorkspaces)
			.where(
				and(
					eq(planArtifactsToWorkspaces.planArtifactId, input.planArtifactId),
					eq(planArtifactsToWorkspaces.workspaceId, input.workspaceId),
				),
			);

		return { id: input.planArtifactId };
	}

	/**
	 * Range and dates to store. Returns nothing when the input leaves them alone.
	 * A day plan always ends on its start date.
	 */
	private resolveDates(
		plan: {
			range: "day" | "week" | "lesson";
			startDate: string;
			endDate: string;
		},
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
			range !== "week" ? startDate : (input.endDate ?? plan.endDate);

		if (endDate < startDate) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "End date must be on or after the start date",
			});
		}

		return { range, startDate, endDate };
	}

	private async findWorkspace(workspaceId: string) {
		const workspace = await this.ctx.db.query.workspaces.findFirst({
			where: (table, { eq }) => eq(table.id, workspaceId),
			columns: { id: true, classroomId: true },
		});
		if (!workspace)
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Workspace not found",
			});
		return workspace;
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
