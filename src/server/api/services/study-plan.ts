import type { z } from "zod";
import { TRPCError } from "@trpc/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import {
	classroomTeachers,
	studyPlanClassrooms,
	studyPlanItems,
	studyPlanProgress,
	studyPlans,
} from "~/server/db/schema";
import {
	applyCompletionMarks,
	buildStudyPlanMarkdown,
	parseStudyPlan,
	type StudyPlanMeta,
} from "~/lib/study-plan-markdown";
import type { TRPCContext } from "../../trpc";
import {
	createStudyPlanInputSchema,
	importStudyPlanInputSchema,
	setStudyPlanItemInputSchema,
	studyPlanClassroomInputSchema,
	studyPlanViewInputSchema,
	updateStudyPlanInputSchema,
} from "../schemas/study-plan";

type Tx = Parameters<Parameters<TRPCContext["db"]["transaction"]>[0]>[0];
type CreateInput = z.infer<typeof createStudyPlanInputSchema>;
type UpdateInput = z.infer<typeof updateStudyPlanInputSchema>;
type ImportInput = z.infer<typeof importStudyPlanInputSchema>;
type SetItemInput = z.infer<typeof setStudyPlanItemInputSchema>;
type ClassroomInput = z.infer<typeof studyPlanClassroomInputSchema>;
type ViewInput = z.infer<typeof studyPlanViewInputSchema>;

export type StudyPlanActor = "teacher" | "agent";

type ItemRow = {
	position: number;
	parentPosition: number | null;
	title: string;
	dueDate: string | null;
};

/**
 * Study plans are stored as markdown in `studyPlans.content` (the checkbox body,
 * with every mark reset to `[ ]`). `studyPlanItems` is the schedule derived from
 * that body. Completion is per classroom, in `studyPlanProgress`, keyed by item
 * position. A missing progress row means the item is not done.
 */
export class StudyPlanService {
	constructor(private readonly ctx: Pick<TRPCContext, "db">) {}

	public async listForClassroom(classroomId: string, userId: string) {
		await this.assertTeacher(classroomId, userId);

		const rows = await this.ctx.db.query.studyPlanClassrooms.findMany({
			where: (table, { eq }) => eq(table.classroomId, classroomId),
			with: {
				studyPlan: {
					with: {
						items: {
							columns: {
								position: true,
								parentPosition: true,
								title: true,
								dueDate: true,
							},
							orderBy: (table, { asc }) => [asc(table.position)],
						},
					},
				},
			},
		});

		const plans = rows
			.map((row) => row.studyPlan)
			.filter((plan) => !plan.deletedAt);

		const progress = await this.loadProgress(
			plans.map((plan) => plan.id),
			[classroomId],
		);

		return plans
			.map((plan) => ({
				id: plan.id,
				title: plan.title,
				description: plan.description,
				updatedAt: plan.updatedAt,
				...this.summarize(plan.items, progress.get(`${plan.id}:${classroomId}`)),
			}))
			.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
	}

	/**
	 * Every plan the user owns or that is attached to a classroom they teach.
	 * Progress is returned only for classrooms the user teaches.
	 */
	public async listAll(userId: string) {
		const sharedPlanIds = this.ctx.db
			.select({ id: studyPlanClassrooms.studyPlanId })
			.from(studyPlanClassrooms)
			.innerJoin(
				classroomTeachers,
				eq(classroomTeachers.classroomId, studyPlanClassrooms.classroomId),
			)
			.where(eq(classroomTeachers.userId, userId));

		const plans = await this.ctx.db.query.studyPlans.findMany({
			where: (table, { and, isNull, or, eq, inArray }) =>
				and(
					isNull(table.deletedAt),
					or(eq(table.userId, userId), inArray(table.id, sharedPlanIds)),
				),
			with: {
				items: {
					columns: {
						position: true,
						parentPosition: true,
						title: true,
						dueDate: true,
					},
					orderBy: (table, { asc }) => [asc(table.position)],
				},
				classrooms: {
					with: { classroom: { columns: { id: true, name: true } } },
				},
			},
			orderBy: (table, { desc }) => [desc(table.updatedAt)],
		});

		const teachable = new Set(
			await this.teachableClassroomIds(
				userId,
				plans.flatMap((plan) => plan.classrooms.map((link) => link.classroomId)),
			),
		);
		const progress = await this.loadProgress(
			plans.map((plan) => plan.id),
			[...teachable],
		);

		return plans.map((plan) => ({
			id: plan.id,
			title: plan.title,
			description: plan.description,
			updatedAt: plan.updatedAt,
			isOwner: plan.userId === userId,
			classrooms: plan.classrooms.map((link) => ({
				id: link.classroom.id,
				name: link.classroom.name,
				progress: teachable.has(link.classroomId)
					? this.summarize(
							plan.items,
							progress.get(`${plan.id}:${link.classroomId}`),
						)
					: null,
			})),
		}));
	}

	/**
	 * One plan with the completion state of a single classroom. Defaults to the first
	 * attached classroom the user teaches.
	 */
	public async getById(input: ViewInput, userId: string) {
		const plan = await this.assertPlanAccess(input.id, userId);

		const full = await this.ctx.db.query.studyPlans.findFirst({
			where: (table, { eq }) => eq(table.id, plan.id),
			with: {
				items: {
					columns: {
						position: true,
						parentPosition: true,
						title: true,
						dueDate: true,
					},
					orderBy: (table, { asc }) => [asc(table.position)],
				},
				classrooms: {
					with: { classroom: { columns: { id: true, name: true } } },
				},
			},
		});
		if (!full) throw this.notFound();

		const attachedIds = full.classrooms.map((link) => link.classroomId);
		const teachable = await this.teachableClassroomIds(userId, attachedIds);

		if (input.classroomId && !teachable.includes(input.classroomId)) {
			throw this.notFound("Classroom not found");
		}

		const selectedClassroomId = input.classroomId ?? teachable[0] ?? null;
		const progressRows = selectedClassroomId
			? await this.ctx.db
					.select({
						position: studyPlanProgress.position,
						completed: studyPlanProgress.completed,
						completedBy: studyPlanProgress.completedBy,
					})
					.from(studyPlanProgress)
					.where(
						and(
							eq(studyPlanProgress.studyPlanId, full.id),
							eq(studyPlanProgress.classroomId, selectedClassroomId),
						),
					)
			: [];
		const progressByPosition = new Map(
			progressRows.map((row) => [row.position, row]),
		);

		return {
			id: full.id,
			title: full.title,
			description: full.description,
			content: full.content,
			isOwner: full.userId === userId,
			classrooms: full.classrooms.map((link) => link.classroom),
			teachableClassroomIds: teachable,
			selectedClassroomId,
			items: full.items.map((item) => {
				const progress = progressByPosition.get(item.position);
				return {
					...item,
					completed: progress?.completed ?? false,
					completedBy: progress?.completed ? progress.completedBy : null,
				};
			}),
		};
	}

	public async create(input: CreateInput, userId: string) {
		for (const classroomId of input.classroomIds) {
			await this.assertTeacher(classroomId, userId);
		}

		const parsed = parseStudyPlan(input.content);
		const content = applyCompletionMarks(parsed.body, []);

		const id = await this.ctx.db.transaction(async (tx) => {
			const [plan] = await tx
				.insert(studyPlans)
				.values({
					userId,
					title: input.title,
					description: input.description,
					content,
				})
				.returning({ id: studyPlans.id });

			if (!plan) throw this.notFound();

			await tx.insert(studyPlanClassrooms).values(
				input.classroomIds.map((classroomId) => ({
					studyPlanId: plan.id,
					classroomId,
				})),
			);

			await this.seedProgress(tx, plan.id, input.classroomIds, parsed.items);
			await this.syncItems(tx, plan.id, content);
			return plan.id;
		});

		return { id };
	}

	/**
	 * Replacing the body keeps progress only for items whose position and title are
	 * unchanged. Anything else is reset for every classroom.
	 */
	public async update(input: UpdateInput, userId: string) {
		await this.assertPlanAccess(input.id, userId);

		await this.ctx.db.transaction(async (tx) => {
			await tx
				.update(studyPlans)
				.set({
					...(input.title !== undefined && { title: input.title }),
					...(input.description !== undefined && {
						description: input.description,
					}),
					...(input.content !== undefined && {
						content: applyCompletionMarks(parseStudyPlan(input.content).body, []),
					}),
					updatedAt: new Date(),
				})
				.where(eq(studyPlans.id, input.id));

			if (input.content !== undefined) {
				const nextItems = parseStudyPlan(input.content).items;
				await this.reconcileProgress(tx, input.id, nextItems);
				await this.syncItems(
					tx,
					input.id,
					applyCompletionMarks(parseStudyPlan(input.content).body, []),
				);
			}
		});

		return { id: input.id };
	}

	/**
	 * Parses a `.md` file. Frontmatter `title` and `description` are used when present.
	 * Any `[x]` marks in the file seed progress for the classrooms it is imported into.
	 * `classroomIds` always come from the caller, since the ids in a file may belong to
	 * another teacher or another install.
	 */
	public async importMarkdown(input: ImportInput, userId: string) {
		const parsed = parseStudyPlan(input.markdown);
		const title =
			parsed.meta.title || input.fallbackTitle || "Imported study plan";

		return this.create(
			{
				title,
				description: parsed.meta.description,
				content: parsed.body.trim(),
				classroomIds: input.classroomIds,
			},
			userId,
		);
	}

	/**
	 * Exports the body with the marks of one classroom's progress. Defaults to the
	 * first attached classroom the user teaches.
	 */
	public async exportMarkdown(input: ViewInput, userId: string) {
		const plan = await this.getById(input, userId);

		const completed = plan.items.map((item) => item.completed);
		const meta: StudyPlanMeta = {
			title: plan.title,
			description: plan.description,
			classrooms: plan.classrooms.map((classroom) => classroom.id),
		};

		return {
			filename: `${slugify(plan.title) || "study-plan"}.md`,
			markdown: buildStudyPlanMarkdown(
				meta,
				applyCompletionMarks(plan.content, completed),
			),
		};
	}

	public async setItemCompleted(
		input: SetItemInput,
		userId: string,
		actor: StudyPlanActor,
	) {
		await this.assertPlanAccess(input.id, userId);
		await this.assertTeacher(input.classroomId, userId);
		await this.assertAttached(input.id, input.classroomId);

		await this.ctx.db.transaction(async (tx) => {
			const [item] = await tx
				.select({ position: studyPlanItems.position })
				.from(studyPlanItems)
				.where(
					and(
						eq(studyPlanItems.studyPlanId, input.id),
						eq(studyPlanItems.position, input.position),
					),
				);

			if (!item) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Study plan item not found",
				});
			}

			const now = new Date();
			await tx
				.insert(studyPlanProgress)
				.values({
					studyPlanId: input.id,
					classroomId: input.classroomId,
					position: input.position,
					completed: input.completed,
					completedAt: input.completed ? now : null,
					completedBy: input.completed ? actor : null,
					updatedAt: now,
				})
				.onConflictDoUpdate({
					target: [
						studyPlanProgress.studyPlanId,
						studyPlanProgress.classroomId,
						studyPlanProgress.position,
					],
					set: {
						completed: input.completed,
						completedAt: input.completed ? now : null,
						completedBy: input.completed ? actor : null,
						updatedAt: now,
					},
				});
		});

		return { id: input.id, classroomId: input.classroomId };
	}

	public async attachToClassroom(input: ClassroomInput, userId: string) {
		await this.assertPlanAccess(input.id, userId);
		await this.assertTeacher(input.classroomId, userId);

		await this.ctx.db
			.insert(studyPlanClassrooms)
			.values({ studyPlanId: input.id, classroomId: input.classroomId })
			.onConflictDoNothing();

		return { id: input.id };
	}

	/**
	 * Removing the attachment also removes that classroom's progress (cascade).
	 */
	public async detachFromClassroom(input: ClassroomInput, userId: string) {
		await this.assertPlanAccess(input.id, userId);
		await this.assertTeacher(input.classroomId, userId);

		await this.ctx.db
			.delete(studyPlanClassrooms)
			.where(
				and(
					eq(studyPlanClassrooms.studyPlanId, input.id),
					eq(studyPlanClassrooms.classroomId, input.classroomId),
				),
			);

		return { id: input.id };
	}

	public async delete(id: string, userId: string) {
		const plan = await this.assertPlanAccess(id, userId);
		if (plan.userId !== userId) throw this.notFound();

		await this.ctx.db
			.update(studyPlans)
			.set({ deletedAt: new Date() })
			.where(eq(studyPlans.id, id));

		return { id };
	}

	private async syncItems(tx: Tx, planId: string, content: string) {
		const { items } = parseStudyPlan(content);

		await tx.delete(studyPlanItems).where(eq(studyPlanItems.studyPlanId, planId));

		if (items.length === 0) return;

		await tx.insert(studyPlanItems).values(
			items.map((item) => ({
				studyPlanId: planId,
				position: item.position,
				parentPosition: item.parentPosition,
				title: item.title,
				dueDate: item.dueDate,
			})),
		);
	}

	private async seedProgress(
		tx: Tx,
		planId: string,
		classroomIds: string[],
		items: { position: number; completed: boolean }[],
	) {
		const done = items.filter((item) => item.completed);
		if (done.length === 0 || classroomIds.length === 0) return;

		const now = new Date();
		await tx.insert(studyPlanProgress).values(
			classroomIds.flatMap((classroomId) =>
				done.map((item) => ({
					studyPlanId: planId,
					classroomId,
					position: item.position,
					completed: true,
					completedAt: now,
					completedBy: "teacher" as const,
					updatedAt: now,
				})),
			),
		);
	}

	/**
	 * Drops progress for positions whose title changed or that no longer exist.
	 */
	private async reconcileProgress(tx: Tx, planId: string, nextItems: ItemRow[]) {
		const previous = await tx
			.select({ position: studyPlanItems.position, title: studyPlanItems.title })
			.from(studyPlanItems)
			.where(eq(studyPlanItems.studyPlanId, planId))
			.orderBy(asc(studyPlanItems.position));

		const nextTitles = new Map(nextItems.map((item) => [item.position, item.title]));
		const stale = previous
			.filter((row) => nextTitles.get(row.position) !== row.title)
			.map((row) => row.position);

		if (stale.length === 0) return;

		await tx
			.delete(studyPlanProgress)
			.where(
				and(
					eq(studyPlanProgress.studyPlanId, planId),
					inArray(studyPlanProgress.position, stale),
				),
			);
	}

	/**
	 * Completed positions, keyed by `${planId}:${classroomId}`.
	 */
	private async loadProgress(planIds: string[], classroomIds: string[]) {
		const map = new Map<string, Set<number>>();
		if (planIds.length === 0 || classroomIds.length === 0) return map;

		const rows = await this.ctx.db
			.select({
				studyPlanId: studyPlanProgress.studyPlanId,
				classroomId: studyPlanProgress.classroomId,
				position: studyPlanProgress.position,
			})
			.from(studyPlanProgress)
			.where(
				and(
					inArray(studyPlanProgress.studyPlanId, planIds),
					inArray(studyPlanProgress.classroomId, classroomIds),
					eq(studyPlanProgress.completed, true),
				),
			);

		for (const row of rows) {
			const key = `${row.studyPlanId}:${row.classroomId}`;
			const set = map.get(key) ?? new Set<number>();
			set.add(row.position);
			map.set(key, set);
		}

		return map;
	}

	private summarize(items: ItemRow[], completed: Set<number> | undefined) {
		const pending = items.filter((item) => !completed?.has(item.position));
		const nextDue = pending
			.filter((item) => item.dueDate)
			.sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))[0];

		return {
			total: items.length,
			completed: items.length - pending.length,
			nextDue: nextDue
				? { title: nextDue.title, dueDate: nextDue.dueDate }
				: null,
		};
	}

	private async teachableClassroomIds(userId: string, classroomIds: string[]) {
		if (classroomIds.length === 0) return [];

		const rows = await this.ctx.db
			.select({ classroomId: classroomTeachers.classroomId })
			.from(classroomTeachers)
			.where(
				and(
					eq(classroomTeachers.userId, userId),
					inArray(classroomTeachers.classroomId, classroomIds),
				),
			);

		return rows.map((row) => row.classroomId);
	}

	private async assertAttached(planId: string, classroomId: string) {
		const link = await this.ctx.db.query.studyPlanClassrooms.findFirst({
			where: (table, { and, eq }) =>
				and(eq(table.studyPlanId, planId), eq(table.classroomId, classroomId)),
		});
		if (!link) throw this.notFound("Classroom not found");
	}

	private async assertPlanAccess(planId: string, userId: string) {
		const plan = await this.ctx.db.query.studyPlans.findFirst({
			where: (table, { and, eq, isNull }) =>
				and(eq(table.id, planId), isNull(table.deletedAt)),
			columns: { id: true, userId: true },
		});
		if (!plan) throw this.notFound();
		if (plan.userId === userId) return plan;

		const [shared] = await this.ctx.db
			.select({ classroomId: studyPlanClassrooms.classroomId })
			.from(studyPlanClassrooms)
			.innerJoin(
				classroomTeachers,
				eq(classroomTeachers.classroomId, studyPlanClassrooms.classroomId),
			)
			.where(
				and(
					eq(studyPlanClassrooms.studyPlanId, planId),
					eq(classroomTeachers.userId, userId),
				),
			)
			.limit(1);

		if (!shared) throw this.notFound();
		return plan;
	}

	private async assertTeacher(classroomId: string, userId: string) {
		const teacher = await this.ctx.db.query.classroomTeachers.findFirst({
			where: (table, { eq, and }) =>
				and(eq(table.classroomId, classroomId), eq(table.userId, userId)),
		});
		if (!teacher) throw this.notFound("Classroom not found");
	}

	private notFound(message = "Study plan not found") {
		return new TRPCError({ code: "NOT_FOUND", message });
	}
}

function slugify(value: string) {
	return value
		.normalize("NFKD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");
}
