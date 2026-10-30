import { tool } from "ai";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { env } from "~/env";
import { db } from "~/server/db";
import {
	classroomStudents,
	examLinks,
	formLinks,
} from "~/server/db/schema";
import { createLinkToken } from "~/server/api/services/link-token";
import EmailService from "~/server/api/services/email";
import {
	getSharedLinkSubject,
	renderSharedLinkEmail,
} from "~/emails/shared-link";
import type { Locale } from "~/lib/utils";

export type ActiveForm = {
	id: string;
	type: "BASIC" | "EXAM";
};

const sharedLinkInputSchema = z.object({
	recipients: z
		.union([z.literal("all"), z.array(z.string().email())])
		.optional()
		.describe(
			'Who receives the link: "all" for every student in the active classroom, or an array of specific student emails from that classroom. Defaults to "all".',
		),
	mode: z
		.enum(["reuse_latest", "create_new"])
		.optional()
		.describe(
			"Only set after the teacher answers whether to re-send the latest existing link or create a new one.",
		),
});

const EMAIL_FROM = "Pennink <no-reply@pennink.xyz>";

const resolveActiveClassroom = async (
	userId: string,
	activeClassroomId?: string | null,
) => {
	if (!activeClassroomId) {
		return null;
	}

	const teacher = await db.query.classroomTeachers.findFirst({
		where: (table) =>
			and(
				eq(table.classroomId, activeClassroomId),
				eq(table.userId, userId),
			),
	});

	return teacher ? activeClassroomId : null;
};

const findLatestTarget = async (
	type: "BASIC" | "EXAM",
	id: string,
	classroomId: string,
) => {
	if (type === "BASIC") {
		const version = await db.query.formVersions.findFirst({
			where: (table) => eq(table.formId, id),
			orderBy: (table, { desc }) => [desc(table.version)],
		});

		if (!version) {
			return null;
		}

		const link = await db.query.formLinks.findFirst({
			where: (table) =>
				and(
					eq(table.formVersionId, version.id),
					eq(table.classroomId, classroomId),
				),
			orderBy: (table, { desc }) => [desc(table.createdAt)],
		});

		return { versionId: version.id, latestLink: link ?? null };
	}

	const version = await db.query.examVersions.findFirst({
		where: (table) => eq(table.examId, id),
		orderBy: (table, { desc }) => [desc(table.version)],
	});

	if (!version) {
		return null;
	}

	const link = await db.query.examLinks.findFirst({
		where: (table) =>
			and(
				eq(table.examVersionId, version.id),
				eq(table.classroomId, classroomId),
			),
		orderBy: (table, { desc }) => [desc(table.createdAt)],
	});

	return { versionId: version.id, latestLink: link ?? null };
};

const createTargetLink = async (
	type: "BASIC" | "EXAM",
	input: { versionId: string; classroomId: string; userId: string },
) => {
	if (type === "BASIC") {
		const [link] = await db
			.insert(formLinks)
			.values({
				formVersionId: input.versionId,
				classroomId: input.classroomId,
				userId: input.userId,
			})
			.returning();

		return link;
	}

	const [link] = await db
		.insert(examLinks)
		.values({
			examVersionId: input.versionId,
			classroomId: input.classroomId,
			userId: input.userId,
		})
		.returning();

	return link;
};

export const createSharedLinkTool = ({
	userId,
	locale,
	activeClassroomId,
	activeForm,
}: {
	userId: string;
	locale: Locale;
	activeClassroomId?: string | null;
	activeForm?: ActiveForm | null;
}) =>
	tool({
		description:
			"Create a shared link for the form or exam the teacher has open and email it to students in the active classroom. Set recipients to 'all' (default) to email every student, or to a list of emails to email only those students. It always shares the open form or exam, so never ask for an id. If no form or exam is open, it sends nothing: ask the teacher to open the one they want to send. Each student gets their own link with a signed token that validates it was opened by them. If a shared link already exists for this form or exam in the classroom, this tool does NOT send anything. It returns status needs_confirmation: ask the teacher whether to re-send the latest link or create a new one, then call again with mode reuse_latest or create_new. Do not set mode before asking.",
		inputSchema: sharedLinkInputSchema,
		execute: async ({ recipients = "all", mode }) => {
			if (!activeForm) {
				return {
					status: "no_active_form",
					message:
						"No form or exam is open. Ask the teacher to open the form or exam they want to send.",
				};
			}

			const { type, id } = activeForm;
			const classroomId = await resolveActiveClassroom(
				userId,
				activeClassroomId,
			);

			if (!classroomId) {
				return {
					status: "error",
					message:
						"No active classroom is selected. Ask the teacher to select the classroom first.",
				};
			}

			const target = await findLatestTarget(type, id, classroomId);

			if (!target) {
				return {
					status: "error",
					message: type === "BASIC" ? "Form not found" : "Exam not found",
				};
			}

			if (target.latestLink && !mode) {
				return {
					status: "needs_confirmation",
					message:
						"A shared link already exists for this classroom. Ask the teacher whether to re-send the latest link or create a new one.",
					latestLink: {
						id: target.latestLink.id,
						createdAt: target.latestLink.createdAt,
					},
				};
			}

			const link =
				mode === "reuse_latest" && target.latestLink
					? target.latestLink
					: await createTargetLink(type, {
							versionId: target.versionId,
							classroomId,
							userId,
						});

			if (!link) {
				return {
					status: "error",
					message: "Failed to create the shared link",
				};
			}

			const classroomStudentsList = await db
				.select({ email: classroomStudents.email })
				.from(classroomStudents)
				.where(eq(classroomStudents.classroomId, classroomId));

			const classroomEmails = new Set(
				classroomStudentsList.map((student) => student.email.toLowerCase()),
			);
			const requested =
				recipients === "all"
					? null
					: [...new Set(recipients.map((email) => email.toLowerCase()))];
			const targetEmails = requested
				? requested.filter((email) => classroomEmails.has(email))
				: [...classroomEmails];
			const unknownEmails = requested?.filter(
				(email) => !classroomEmails.has(email),
			);

			if (targetEmails.length === 0) {
				return {
					status: "error",
					message: "No students in the active classroom match the request",
					unknownEmails,
				};
			}

			const classroom = await db.query.classrooms.findFirst({
				where: (table) => eq(table.id, classroomId),
				columns: { name: true },
			});
			const classroomName = classroom?.name ?? "your classroom";
			const kind = type === "BASIC" ? "form" : "exam";
			const emailService = new EmailService({});

			const results = await Promise.allSettled(
				targetEmails.map(async (email) => {
					const token = createLinkToken({ linkId: link.id, email });
					const url = `${env.NEXTAUTH_URL}/${kind}/link/${link.id}?t=${token}`;

					return emailService.send({
						from: EMAIL_FROM,
						to: [email],
						subject: getSharedLinkSubject({ locale, classroomName, kind }),
						html: await renderSharedLinkEmail({
							locale,
							classroomName,
							kind,
							linkTo: url,
							recipientEmail: email,
						}),
					});
				}),
			);

			const sent = results.filter((result) => result.status === "fulfilled");

			return {
				status: "sent",
				createdNewLink: mode !== "reuse_latest" || !target.latestLink,
				linkId: link.id,
				sent: sent.length,
				failed: results.length - sent.length,
				recipients: targetEmails.length,
				unknownEmails: unknownEmails?.length ? unknownEmails : undefined,
			};
		},
	});
