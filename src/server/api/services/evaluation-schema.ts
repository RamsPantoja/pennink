import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, ilike, isNull } from "drizzle-orm";
import type { z } from "zod";
import { evaluationSchemas } from "~/server/db/schema";
import type { TRPCContext } from "../../trpc";
import {
	compileEvaluationSchema,
	type createEvaluationSchemaInputSchema,
	type listEvaluationSchemasInputSchema,
	type updateEvaluationSchemaInputSchema,
} from "../schemas/evaluation-schema";
import { paginate } from "../schemas/pagination";

type ListInput = z.infer<typeof listEvaluationSchemasInputSchema>;
type CreateInput = z.infer<typeof createEvaluationSchemaInputSchema>;
type UpdateInput = z.infer<typeof updateEvaluationSchemaInputSchema>;

/** Teacher-owned evaluation schemas. */
export class EvaluationSchemaService {
	constructor(private readonly ctx: Pick<TRPCContext, "db">) {}

	public async list(input: ListInput, userId: string) {
		const titleMatch = `%${input.search ?? ""}%`;
		const where = and(
			eq(evaluationSchemas.userId, userId),
			isNull(evaluationSchemas.deletedAt),
			input.search ? ilike(evaluationSchemas.name, titleMatch) : undefined,
		);

		return paginate(
			input,
			({ limit, offset }) =>
				this.ctx.db
					.select()
					.from(evaluationSchemas)
					.where(where)
					.orderBy(
						desc(evaluationSchemas.updatedAt),
						desc(evaluationSchemas.id),
					)
					.limit(limit)
					.offset(offset),
			async () => {
				const [row] = await this.ctx.db
					.select({ total: count() })
					.from(evaluationSchemas)
					.where(where);
				return row?.total ?? 0;
			},
		);
	}

	public async getById(id: string, userId: string) {
		return this.findOwned(id, userId);
	}

	public async create(input: CreateInput, userId: string) {
		// Compiling here rejects anything the Jev mapping cannot express before it is stored.
		compileEvaluationSchema(input.definition);

		const [row] = await this.ctx.db
			.insert(evaluationSchemas)
			.values({
				userId,
				name: input.name,
				description: input.description,
				definition: input.definition,
			})
			.returning();

		if (!row) {
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: "Could not create evaluation schema",
			});
		}
		return row;
	}

	public async update(input: UpdateInput, userId: string) {
		const current = await this.findOwned(input.id, userId);

		const [row] = await this.ctx.db
			.update(evaluationSchemas)
			.set({
				name: input.name ?? current.name,
				description: input.description ?? current.description,
				definition: input.definition ?? current.definition,
				updatedAt: new Date(),
			})
			.where(eq(evaluationSchemas.id, current.id))
			.returning();

		if (!row) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Evaluation schema not found",
			});
		}
		return row;
	}

	/** Copies a schema under a new name. */
	public async duplicate(id: string, userId: string) {
		const source = await this.findOwned(id, userId);
		return this.create(
			{
				name: `${source.name} (copy)`.slice(0, 150),
				description: source.description,
				definition: source.definition,
			},
			userId,
		);
	}

	public async delete(id: string, userId: string) {
		const current = await this.findOwned(id, userId);
		await this.ctx.db
			.update(evaluationSchemas)
			.set({ deletedAt: new Date() })
			.where(eq(evaluationSchemas.id, current.id));
		return { id: current.id };
	}

	private async findOwned(id: string, userId: string) {
		const [row] = await this.ctx.db
			.select()
			.from(evaluationSchemas)
			.where(
				and(
					eq(evaluationSchemas.id, id),
					eq(evaluationSchemas.userId, userId),
					isNull(evaluationSchemas.deletedAt),
				),
			)
			.limit(1);

		if (!row) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Evaluation schema not found",
			});
		}
		return row;
	}
}
