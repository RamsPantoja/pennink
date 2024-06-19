import { type TRPCContext } from "../trpc";

type WeeklyDaysServiceContructor = {
    ctx: TRPCContext
}

class WeeklyDaysService {
    ctx: TRPCContext

    constructor({ ctx }: WeeklyDaysServiceContructor) {
        this.ctx = ctx;
    }

    async getAll() {
        const weeklyDaysList = await this.ctx.db.query.weeklyDays.findMany({
            orderBy: (weeklyDays, { asc }) => [asc(weeklyDays.order)],
        });

        return weeklyDaysList;
    }
}

export default WeeklyDaysService;