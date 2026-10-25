import { TRPCError } from "@trpc/server";
import type { TRPCContext } from "../../trpc";
import { statics, users } from "~/server/db/schema";
import { DateTime } from "luxon";
import { eq } from "drizzle-orm";
import type { Locale } from "~/lib/utils";

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
				message: "Failed to initialize user statics",
			});
		}
	}

	public async getStatics(userId: string) {
		const currentStatics = await this.ctx.db.query.statics.findFirst({
			where: (statics, { eq }) => {
				return eq(statics.userId, userId);
			},
		});

		if (!currentStatics) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Statics not found",
			});
		}

		return currentStatics;
	}

	public async resetStatics(userId: string) {
		try {
			const userStatics = await this.ctx.db.query.statics.findFirst({
				where: (statics, { eq }) => {
					return eq(statics.userId, userId);
				},
				with: {
					user: true,
				},
			});

			if (userStatics) {
				const referenceDate = DateTime.fromJSDate(
					userStatics.workspacesResetedAt,
				);
				const currentDate = DateTime.now();
				const diff = currentDate.diff(referenceDate, "days");

				//Reset files metric to 0 to allow user upload files again
				if (diff.days >= 1) {
					await this.ctx.db
						.update(statics)
						.set({
							workspaces: 0,
							messages: 0,
							files: 0,
							workspacesResetedAt: new Date(),
						})
						.where(eq(statics.id, userStatics.id));
				}
			}
		} catch (e) {
			console.error(e);
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Error on reset user statics",
			});
		}
	}

	public async updateLocale(userId: string, locale: Locale) {
		await this.ctx.db
			.update(users)
			.set({ locale })
			.where(eq(users.id, userId));
	}
}
