import { type z } from "zod";
import { type TRPCContext } from "../trpc";
import { type createUserRoleInputSchema } from "../schemas/useRole";
import { userRoles, userRolesToRoles } from "~/server/db/schema";
import { type Session } from "next-auth";
import { TRPCError } from "@trpc/server";

type UserRoleServiceContructor = {
    ctx: TRPCContext
}

type CreateUserRoleInput = z.infer<typeof createUserRoleInputSchema>

class UserRoleService {
    ctx: TRPCContext

    constructor({ ctx }: UserRoleServiceContructor) {
        this.ctx = ctx;
    }

    async create(input: CreateUserRoleInput, session: Session) {
        const { roleId, description, hourPrice } = input;

        const result = await this.ctx.db.transaction(async (tx) => {
            const [userRole] = await tx.insert(userRoles).values({
                description,
                hourPrice: hourPrice.toString(),
                userId: session.user.id
            }).returning()

            if (!userRole) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: 'User role not created',
                });
            }

            await tx.insert(userRolesToRoles).values({
                userRoleId: userRole.id,
                roleId
            }).returning();
        })

        return result;
    }
}

export default UserRoleService;