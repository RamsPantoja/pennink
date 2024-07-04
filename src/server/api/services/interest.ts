
import { type TRPCContext } from "../trpc";

type InterestServiceContructor = {
    ctx: TRPCContext
}

class InterestService {
    ctx: TRPCContext

    constructor({ ctx }: InterestServiceContructor) {
        this.ctx = ctx;
    }

    async getAll() {
        const roleList = await this.ctx.db.query.interests.findMany({
            orderBy: (interests, { asc }) => [asc(interests.name)],
        });
        return roleList;
    }
}

export default InterestService;