import { type z } from "zod";
import { type TRPCContext } from "../trpc";
import { type createUserRoleInputSchema } from "../schemas/useRole";
import { userRoleDetails, userRoles } from "~/server/db/schema";
import { type Session } from "next-auth";
import { TRPCError } from "@trpc/server";

type UserRoleServiceContructor = {
    ctx: TRPCContext
}

type CreateUserRoleInput = z.infer<typeof createUserRoleInputSchema>;
export type UserRoleDetailInsert = typeof userRoleDetails.$inferInsert;
export type UserRoleDetail = typeof userRoleDetails.$inferSelect;

class UserRoleService {
    ctx: TRPCContext

    constructor({ ctx }: UserRoleServiceContructor) {
        this.ctx = ctx;
    }

    async create(input: CreateUserRoleInput, session: Session) {
        const { roleId, description, hourPrice, details } = input;

        const result = await this.ctx.db.transaction(async (tx) => {
            const [userRole] = await tx.insert(userRoles).values({
                description,
                hourPrice: hourPrice.toString(),
                userId: session.user.id,
                roleId
            }).returning()

            if (!userRole) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: 'User role not created',
                });
            }

            const detailsWithUserRoleId: UserRoleDetailInsert[] = details.map((item) => {
                return {
                    ...item,
                    userRoleId: userRole.id
                }
            });

            await tx.insert(userRoleDetails).values(detailsWithUserRoleId);

            return userRole;
        })

        return result;
    }

    async getUserRoles(session: Session) {
        const roles = await this.ctx.db.query.userRoles.findMany({
            where: (userRoles, { eq }) => {
                return eq(userRoles.userId, session.user.id);
            },
            with: {
                role: true,
                userRoleDetails: true
            }
        });

        return roles;
    }
}

export default UserRoleService;