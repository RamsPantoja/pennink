import { tool } from "ai";
import { z } from "zod";
import { db } from "~/server/db";
import { StudyPlanService } from "~/server/api/services/study-plan";
import { MAX_PAGE_SIZE } from "~/server/api/schemas/pagination";

const studyPlanToolInputSchema = z.object({
	action: z
		.enum(["list", "read", "create", "update", "toggle_item", "attach"])
		.describe(
			"list: plans attached to the active classroom. read: one plan with its numbered items. create: new plan attached to the active classroom. update: change title, description or markdown body. toggle_item: tick or untick one checkbox item. attach: attach an existing plan to the active classroom.",
		),
	id: z
		.string()
		.uuid()
		.optional()
		.describe("Study plan id. Required for read, update, toggle_item and attach."),
	title: z.string().trim().min(1).max(150).optional(),
	description: z.string().trim().max(1000).optional(),
	content: z
		.string()
		.max(200_000)
		.optional()
		.describe(
			"Markdown body of the plan: dated checkbox lines such as `- [ ] 2026-11-03 Read chapter 3`, optionally grouped under headings. Sub-topics are checkbox lines indented under a parent checkbox, one level deep. Do not include frontmatter.",
		),
	position: z
		.number()
		.int()
		.min(0)
		.optional()
		.describe(
			"Zero-based index of the checkbox item, in the order returned by read. Required for toggle_item.",
		),
	completed: z
		.boolean()
		.optional()
		.describe("Required for toggle_item. true marks the item done."),
});

type StudyPlanToolInput = z.infer<typeof studyPlanToolInputSchema>;

export const createStudyPlanTool = ({
	userId,
	activeClassroomId,
}: {
	userId: string;
	activeClassroomId?: string | null;
}) => {
	const service = new StudyPlanService({ db });

	const requireClassroom = () => {
		if (!activeClassroomId) {
			throw new Error("Select a classroom before managing study plans");
		}
		return activeClassroomId;
	};

	const requireId = (id: string | undefined) => {
		if (!id) throw new Error("A study plan id is required for this action");
		return id;
	};

	return tool({
		description:
			"Create, read, update, attach and tick off study plans. Completion is tracked per classroom, so ticks apply to the active classroom. Study plans are markdown checklists with dated items. Use list or read first to get ids and item positions.",
		inputSchema: studyPlanToolInputSchema,
		execute: async (input: StudyPlanToolInput) => {
			switch (input.action) {
				case "list": {
					const page = await service.listForClassroom(
						{
							classroomId: requireClassroom(),
							page: 1,
							pageSize: MAX_PAGE_SIZE,
						},
						userId,
					);
					return { plans: page.items };
				}
				case "read": {
					const plan = await service.getById(
						{
							id: requireId(input.id),
							classroomId: activeClassroomId ?? undefined,
						},
						userId,
					);
					return {
						id: plan.id,
						title: plan.title,
						description: plan.description,
						classroomId: plan.selectedClassroomId,
						items: plan.items.map((item) => ({
							position: item.position,
							parentPosition: item.parentPosition,
							title: item.title,
							dueDate: item.dueDate,
							completed: item.completed,
						})),
					};
				}
				case "create": {
					const classroomId = requireClassroom();
					if (!input.title) throw new Error("A title is required");
					const { id } = await service.create(
						{
							title: input.title,
							description: input.description ?? "",
							content: input.content ?? "",
							classroomIds: [classroomId],
						},
						userId,
					);
					return { id, title: input.title };
				}
				case "update": {
					const id = requireId(input.id);
					await service.update(
						{
							id,
							title: input.title,
							description: input.description,
							content: input.content,
						},
						userId,
					);
					return { id };
				}
				case "toggle_item": {
					const id = requireId(input.id);
					if (input.position === undefined || input.completed === undefined) {
						throw new Error("position and completed are required");
					}
					const classroomId = requireClassroom();
					await service.setItemCompleted(
						{
							id,
							classroomId,
							position: input.position,
							completed: input.completed,
						},
						userId,
						"agent",
					);
					return {
						id,
						classroomId,
						position: input.position,
						completed: input.completed,
					};
				}
				case "attach": {
					const id = requireId(input.id);
					await service.attachToClassroom(
						{ id, classroomId: requireClassroom() },
						userId,
					);
					return { id };
				}
			}
		},
	});
};
