import { type TRPCContext } from "../trpc";
import { type interests } from "~/server/db/schema";

type InterestServiceContructor = {
    ctx: TRPCContext
}

export type Interest = typeof interests.$inferSelect;

class InterestService {
    ctx: TRPCContext

    constructor({ ctx }: InterestServiceContructor) {
        this.ctx = ctx;
    }

    async getAll(): Promise<Interest[]> {
        const roleList = await this.ctx.db.query.interests.findMany({
            orderBy: (interests, { asc }) => [asc(interests.name)],
        });
        return roleList;
    }
}

export default InterestService;