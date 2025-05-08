import { TRPCError } from "@trpc/server";
import type { TRPCContext } from "../trpc";
import { statics } from "~/server/db/schema";

type UserServiceContructor = {
	ctx: TRPCContext;
};

export class UserService {
	ctx: TRPCContext;

	constructor({ ctx }: UserServiceContructor) {
		this.ctx = ctx;
	}

	public async initStatics(userId: string) {
		try {
			const currentStatics = await this.ctx.db.query.statics.findFirst({
				where: (statics, { eq }) => {
					return eq(statics.userId, userId);
				},
			});

			if (currentStatics) {
				return currentStatics;
			}

			const [staticsRecord] = await this.ctx.db
				.insert(statics)
				.values({
					userId,
				})
				.returning();

			if (!staticsRecord) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Failed to initialize user statics",
				});
			}

			return staticsRecord;
		} catch (error) {
			console.log(error);
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Failed to search documents",
			});
		}
	}
}
