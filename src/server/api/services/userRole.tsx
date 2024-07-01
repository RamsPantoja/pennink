import { type z } from "zod";
import { type TRPCContext } from "../trpc";
import { type updateUserRoleInputSchema, type createUserRoleInputSchema, type deleteUserRoleInputSchema } from "../schemas/useRole";
import { userRoleDetails, userRoles, userTimes } from "~/server/db/schema";
import { type Session } from "next-auth";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

type UserRoleServiceContructor = {
    ctx: TRPCContext
}

type CreateUserRoleInput = z.infer<typeof createUserRoleInputSchema>;
export type UserRoleDetailInsert = typeof userRoleDetails.$inferInsert;
export type UserRoleDetail = typeof userRoleDetails.$inferSelect;
type UpdateUserRoleInput = z.infer<typeof updateUserRoleInputSchema>;
type DeleteUserRoleInput = z.infer<typeof deleteUserRoleInputSchema>;

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
            where: (userRoles, { eq, and, isNull }) => {
                return and(
                    eq(userRoles.userId, session.user.id),
                    isNull(userRoles.deletedAt)
                )
            },
            with: {
                role: true,
                userRoleDetails: true
            }
        });

        return roles;
    }

    async getUserRoleById(userRoleId: string) {
        const userRole = await this.ctx.db.query.userRoles.findFirst({
            where: (userRoles, { eq }) => {
                return eq(userRoles.id, userRoleId);
            },
            with: {
                userRoleDetails: true,
                role: true
            }
        });

        if (!userRole) {
            throw new TRPCError({
                code: "CONFLICT",
                message: 'User role not found',
            });
        }

        return userRole;
    }

    async update(input: UpdateUserRoleInput) {
        const {
            id,
            data
        } = input;

        const result = await this.ctx.db.transaction(async (tx) => {
            const [userRole] = await tx.update(userRoles)
                .set({
                    description: data.description,
                    hourPrice: data.hourPrice.toString(),
                })
                .where(eq(userRoles.id, id))
                .returning();

            if (!userRole) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: 'User role can not be updated',
                });
            }

            await tx.delete(userRoleDetails)
                .where(eq(userRoleDetails.userRoleId, id));

            const detailsWithUserRoleId: UserRoleDetailInsert[] = data.details.map((item) => {
                return {
                    ...item,
                    userRoleId: id
                }
            });

            await tx.insert(userRoleDetails).values(detailsWithUserRoleId);

            return userRole;
        });

        return result;
    }

    public async delete(input: DeleteUserRoleInput) {
        const { id } = input;

        const result = await this.ctx.db.transaction(async (tx) => {
            const [userRole] = await tx.update(userRoles)
                .set({
                    deletedAt: new Date()
                })
                .where(eq(userRoles.id, id))
                .returning();

            if (!userRole) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: 'User role can not be deleted',
                });
            }

            await tx.delete(userTimes)
                .where(eq(userTimes.userRoleId, userRole.id));

            return userRole;
        });

        return result;
    }
}

export default UserRoleService;