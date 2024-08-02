import { userTimes, usersToWeeklydays } from "~/server/db/schema";
import { type TRPCContext } from "../trpc";
import { type WhereUserTimesInputSchema, type createUserTimesInputSchema } from "../schemas/userTime";
import { type z } from "zod";
import { type Session } from "next-auth";
import { eq } from "drizzle-orm";

type UserTimeServiceContructor = {
    ctx: TRPCContext
}

type CreateUserTimesInput = z.infer<typeof createUserTimesInputSchema>;
type WhereUserTimesInput = z.infer<typeof WhereUserTimesInputSchema>;
export type UserTimeInsert = typeof userTimes.$inferInsert;

class UserTimeService {
    ctx: TRPCContext

    constructor({ ctx }: UserTimeServiceContructor) {
        this.ctx = ctx;
    }

    public async update(input: CreateUserTimesInput, session: Session) {
        const {
            intervals
        } = input;

        const removeDuplicatedIds = (list: string[]) => {
            return [...new Set(list)];
        }

        const userToWeeklyDays = removeDuplicatedIds(intervals.map((item) => item.weeklyDayId)).map((item) => {
            return {
                weeklyDayId: item,
                userId: session.user.id
            }
        });

        const result = await this.ctx.db.transaction(async (tx) => {
            await tx.delete(usersToWeeklydays)
                .where(eq(usersToWeeklydays.userId, session.user.id));

            await tx.delete(userTimes)
                .where(eq(userTimes.userId, session.user.id));

            const userTimeList = await tx.insert(userTimes).values(intervals.map((item) => {
                return {
                    ...item,
                    userId: session.user.id
                }
            })).returning();

            await tx.insert(usersToWeeklydays).values(userToWeeklyDays);

            return userTimeList;
        });

        return result;
    }

    public async getUserTimes(input: WhereUserTimesInput) {
        const {
            weeklyDayIds,
            userId,
            userRoleIds
        } = input;

        const userTimesList = await this.ctx.db.query.userTimes.findMany({
            where: (userTimes, { and, inArray, eq }) => {
                return and(
                    weeklyDayIds ? inArray(userTimes.weeklyDayId, weeklyDayIds) : undefined,
                    userId ? eq(userTimes.userId, userId) : undefined,
                    userRoleIds ? inArray(userTimes.userRoleId, userRoleIds) : undefined,
                )
            },
            with: {
                weeklyDay: true,
                userRole: {
                    with: {
                        role: true
                    }
                }
            }
        });

        return userTimesList;
    }
}

export default UserTimeService;