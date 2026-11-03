import { z } from "zod";

const planArtifactIdSchema = z.string().uuid();
const classroomIdSchema = z.string().uuid();

const titleSchema = z.string().trim().min(1).max(150);
const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const planArtifactByIdInputSchema = z.object({
	id: planArtifactIdSchema,
});

export const updatePlanArtifactInputSchema = z.object({
	id: planArtifactIdSchema,
	title: titleSchema.optional(),
	range: z.enum(["day", "week", "lesson"]).optional(),
	startDate: isoDateSchema.optional(),
	endDate: isoDateSchema.optional(),
	content: z.string().max(200_000).optional(),
	blocks: z.array(z.record(z.string(), z.unknown())).max(5_000).optional(),
});

export const workspacePlanArtifactsInputSchema = z.object({
	workspaceId: z.string().uuid(),
});

export const workspacePlanArtifactInputSchema = z.object({
	workspaceId: z.string().uuid(),
	planArtifactId: planArtifactIdSchema,
});

export const createPlanArtifactInputSchema = z.object({
	classroomId: classroomIdSchema,
	title: titleSchema,
	range: z.enum(["day", "week", "lesson"]),
	startDate: isoDateSchema,
	endDate: isoDateSchema,
	content: z.string().max(200_000).default(""),
});
