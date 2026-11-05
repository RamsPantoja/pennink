import { GetObjectCommand } from "@aws-sdk/client-s3";
import { TRPCError } from "@trpc/server";
import { and, asc, count, desc, eq, ilike, isNull } from "drizzle-orm";
import type { z } from "zod";
import { env } from "~/env";
import { buildRunCsv } from "~/lib/evaluation/csv";
import {
	JEV_MAX_BODY_BYTES,
	type JevPage,
	buildJevRequest,
	estimateJevBodyBytes,
	examScore,
	mapJevAnswers,
	needsReview,
} from "~/lib/evaluation/jev";
import {
	evaluationRuns,
	evaluationSchemas,
	evaluationSubmissionPages,
	evaluationSubmissions,
} from "~/server/db/schema";
import type { TRPCContext } from "../../trpc";
import {
	type EvaluationAnswers,
	MAX_SUBMISSIONS_PER_RUN,
	type createEvaluationRunInputSchema,
	type createEvaluationSubmissionInputSchema,
	type listEvaluationRunsInputSchema,
	type overrideEvaluationAnswerInputSchema,
} from "../schemas/evaluation-run";
import { normalizeLegacyDefinition } from "../schemas/evaluation-schema";
import { paginate } from "../schemas/pagination";
import { callJevSystemOne } from "./jev";
import { createR2Client } from "./storage";

type ListInput = z.infer<typeof listEvaluationRunsInputSchema>;
type CreateRunInput = z.infer<typeof createEvaluationRunInputSchema>;
type CreateSubmissionInput = z.infer<
	typeof createEvaluationSubmissionInputSchema
>;
type OverrideInput = z.infer<typeof overrideEvaluationAnswerInputSchema>;

/**
 * An evaluation run grades one set of uploaded exams against one schema snapshot.
 * Each student is a submission made of page images. Grading is one Jev call per submission.
 */
export class EvaluationRunService {
	constructor(private readonly ctx: Pick<TRPCContext, "db">) {}

	public async list(input: ListInput, userId: string) {
		const titleMatch = `%${input.search ?? ""}%`;
		const where = and(
			eq(evaluationRuns.userId, userId),
			input.search ? ilike(evaluationRuns.name, titleMatch) : undefined,
		);

		return paginate(
			input,
			({ limit, offset }) =>
				this.ctx.db
					.select()
					.from(evaluationRuns)
					.where(where)
					.orderBy(desc(evaluationRuns.createdAt), desc(evaluationRuns.id))
					.limit(limit)
					.offset(offset),
			async () => {
				const [row] = await this.ctx.db
					.select({ total: count() })
					.from(evaluationRuns)
					.where(where);
				return row?.total ?? 0;
			},
		);
	}

	public async getById(id: string, userId: string) {
		const run = await this.findOwnedRun(id, userId);
		const submissions = await this.ctx.db
			.select()
			.from(evaluationSubmissions)
			.where(eq(evaluationSubmissions.runId, id))
			.orderBy(asc(evaluationSubmissions.studentName));
		return { ...run, submissions };
	}

	public async create(input: CreateRunInput, userId: string) {
		const [schema] = await this.ctx.db
			.select()
			.from(evaluationSchemas)
			.where(
				and(
					eq(evaluationSchemas.id, input.evaluationSchemaId),
					eq(evaluationSchemas.userId, userId),
					isNull(evaluationSchemas.deletedAt),
				),
			)
			.limit(1);
		if (!schema) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Evaluation schema not found",
			});
		}

		const [run] = await this.ctx.db
			.insert(evaluationRuns)
			.values({
				userId,
				evaluationSchemaId: schema.id,
				name: input.name,
				// Legacy choice/score/box questions are stored as yes/no from here on.
				schemaSnapshot: normalizeLegacyDefinition(schema.definition)
					.definition as typeof schema.definition,
			})
			.returning();
		if (!run) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Could not create run",
			});
		}
		return run;
	}

	/** Records a student's page images after they are uploaded to storage. */
	public async createSubmission(input: CreateSubmissionInput, userId: string) {
		await this.findOwnedRun(input.runId, userId);

		const [existing] = await this.ctx.db
			.select({ total: count() })
			.from(evaluationSubmissions)
			.where(eq(evaluationSubmissions.runId, input.runId));
		if ((existing?.total ?? 0) >= MAX_SUBMISSIONS_PER_RUN) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: `A run can hold at most ${MAX_SUBMISSIONS_PER_RUN} students`,
			});
		}

		return this.ctx.db.transaction(async (tx) => {
			const [submission] = await tx
				.insert(evaluationSubmissions)
				.values({ runId: input.runId, studentName: input.studentName })
				.returning();
			if (!submission) {
				throw new TRPCError({
					code: "INTERNAL_SERVER_ERROR",
					message: "Could not create submission",
				});
			}

			await tx.insert(evaluationSubmissionPages).values(
				input.pages.map((page) => ({
					submissionId: submission.id,
					pageNo: page.pageNo,
					storageKey: page.storageKey,
					mimeType: page.mimeType,
				})),
			);
			return submission;
		});
	}

	/**
	 * Grades one submission with Jev. Failures are stored on the submission, so the teacher
	 * can see which student failed and retry it.
	 */
	public async grade(id: string, userId: string) {
		const submission = await this.findOwnedSubmission(id, userId);
		const run = await this.findOwnedRun(submission.runId, userId);

		await this.ctx.db
			.update(evaluationSubmissions)
			.set({ status: "running", errorMessage: null, updatedAt: new Date() })
			.where(eq(evaluationSubmissions.id, id));

		try {
			const pages = await this.ctx.db
				.select()
				.from(evaluationSubmissionPages)
				.where(eq(evaluationSubmissionPages.submissionId, id))
				.orderBy(asc(evaluationSubmissionPages.pageNo));
			if (pages.length === 0) throw new Error("This submission has no pages");

			const jevPages: JevPage[] = [];
			for (const page of pages) {
				jevPages.push({
					placeholder: `page_${page.pageNo}`,
					mimeType: page.mimeType as JevPage["mimeType"],
					base64: await this.readPageBase64(page.storageKey),
				});
			}

			if (estimateJevBodyBytes(jevPages) > JEV_MAX_BODY_BYTES) {
				throw new Error(
					"These pages are too large for one Jev request. Upload fewer or smaller pages.",
				);
			}

			const request = buildJevRequest({
				definition: run.schemaSnapshot,
				pages: jevPages,
				model: env.JEV_MODEL,
			});
			const response = await callJevSystemOne(request);
			const { answers, score } = mapJevAnswers(
				run.schemaSnapshot,
				response.answers,
			);

			const [updated] = await this.ctx.db
				.update(evaluationSubmissions)
				.set({
					status: needsReview(answers) ? "needs_review" : "graded",
					score,
					answers,
					// Store usage only. The raw response is kept for audit, not the images.
					rawResponse: { model: response.model, usage: response.usage },
					updatedAt: new Date(),
				})
				.where(eq(evaluationSubmissions.id, id))
				.returning();
			return updated;
		} catch (error) {
			const message = error instanceof Error ? error.message : "Grading failed";
			await this.ctx.db
				.update(evaluationSubmissions)
				.set({ status: "failed", errorMessage: message, updatedAt: new Date() })
				.where(eq(evaluationSubmissions.id, id));
			throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message });
		}
	}

	/** Sets or clears a teacher score for one question, then recalculates the student's total. */
	public async overrideAnswer(input: OverrideInput, userId: string) {
		const submission = await this.findOwnedSubmission(
			input.submissionId,
			userId,
		);
		const answers = submission.answers ?? {};
		const answer = answers[input.key];
		if (!answer) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Question not found for this student",
			});
		}

		const { override: _previous, ...base } = answer;
		const next: EvaluationAnswers = {
			...answers,
			[input.key]:
				input.score === null ? base : { ...base, override: input.score },
		};

		const [updated] = await this.ctx.db
			.update(evaluationSubmissions)
			.set({
				answers: next,
				score: examScore(next),
				status:
					submission.status === "failed"
						? "failed"
						: needsReview(next)
							? "needs_review"
							: "graded",
				updatedAt: new Date(),
			})
			.where(eq(evaluationSubmissions.id, submission.id))
			.returning();
		return updated;
	}

	public async exportCsv(runId: string, userId: string) {
		const run = await this.findOwnedRun(runId, userId);
		const submissions = await this.ctx.db
			.select()
			.from(evaluationSubmissions)
			.where(eq(evaluationSubmissions.runId, runId))
			.orderBy(asc(evaluationSubmissions.studentName));

		const questionKeys = run.schemaSnapshot.questions.map(
			(question) => question.key,
		);
		return {
			filename: `${run.name.replace(/[^\w-]+/g, "-") || "evaluation"}.csv`,
			csv: buildRunCsv(questionKeys, submissions),
		};
	}

	private async readPageBase64(storageKey: string) {
		const object = await createR2Client().send(
			new GetObjectCommand({ Bucket: env.BUCKET, Key: storageKey }),
		);
		if (!object.Body)
			throw new Error(`Page ${storageKey} is missing from storage`);
		const bytes = await object.Body.transformToByteArray();
		return Buffer.from(bytes).toString("base64");
	}

	private async findOwnedRun(id: string, userId: string) {
		const [run] = await this.ctx.db
			.select()
			.from(evaluationRuns)
			.where(and(eq(evaluationRuns.id, id), eq(evaluationRuns.userId, userId)))
			.limit(1);
		if (!run)
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Evaluation run not found",
			});
		return run;
	}

	private async findOwnedSubmission(id: string, userId: string) {
		const [row] = await this.ctx.db
			.select({ submission: evaluationSubmissions })
			.from(evaluationSubmissions)
			.innerJoin(
				evaluationRuns,
				eq(evaluationRuns.id, evaluationSubmissions.runId),
			)
			.where(
				and(
					eq(evaluationSubmissions.id, id),
					eq(evaluationRuns.userId, userId),
				),
			)
			.limit(1);
		if (!row)
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Submission not found",
			});
		return row.submission;
	}
}
