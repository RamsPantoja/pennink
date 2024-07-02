import { type TRPCContext } from "../trpc";

type RoleServiceContructor = {
    ctx: TRPCContext
}

class RoleService {
    ctx: TRPCContext

    constructor({ ctx }: RoleServiceContructor) {
        this.ctx = ctx;
    }

    async getAll() {
        const roleList = await this.ctx.db.query.roles.findMany({
            orderBy: (roles, { asc }) => [asc(roles.name)],
        });
        return roleList;
    }
}

export default RoleService;