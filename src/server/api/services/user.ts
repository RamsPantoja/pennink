import { type z } from "zod";
import { type TRPCContext } from "../trpc";
import { type getUserByIdInputSchema, type buuddyModeUserInputSchema, type buuddiesInputSchema } from "../schemas/user";
import { type Session } from "next-auth";
import { profiles, roles, userRoles, users, usersToInterests } from "~/server/db/schema";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

type UserServiceContructor = {
    ctx: TRPCContext
}

type BuuddyModeUserInput = z.infer<typeof buuddyModeUserInputSchema>
type GetUserByIdInput = z.infer<typeof getUserByIdInputSchema>
type BuuddiesInput = z.infer<typeof buuddiesInputSchema>

class UserService {
    ctx: TRPCContext

    constructor({ ctx }: UserServiceContructor) {
        this.ctx = ctx;
    }

    public async updateBuuddyMode(input: BuuddyModeUserInput, session: Session) {
        const [user] = await this.ctx.db.update(users)
            .set({
                buuddyMode: input.isActive
            })
            .where(eq(users.id, session.user.id))
            .returning();

        if (!user) {
            throw new TRPCError({
                code: "CONFLICT",
                message: 'Fail on updating the buuddy mode',
            });
        }

        return user;
    }

    public async getUserById(input: GetUserByIdInput) {
        const { id } = input;

        const user = await this.ctx.db.query.users.findFirst({
            where: (users, { eq }) => {
                return eq(users.id, id);
            }
        });

        if (!user) {
            throw new TRPCError({
                code: "CONFLICT",
                message: 'User not found',
            });
        }

        return user;
    }

    public async getBuuddies(input: BuuddiesInput) {
        const {
            interests,
            name
        } = input;

        const buuddies = await this.ctx.db.select({
            user: {
                id: users.id,
                name: users.name,
                verified: users.verified,
                image: users.image,
                buuddyMode: users.buuddyMode,
            },
            profile: {
                id: profiles.id,
                headline: profiles.headline,
                gender: profiles.gender,
                username: profiles.username
            },
            userRole: {
                id: userRoles.id,
                roleId: userRoles.roleId,
                hourPrice: userRoles.hourPrice,
                role: roles.name
            }
        })
            .from(users)
            .leftJoin(profiles, eq(users.id, profiles.userId))
            .leftJoin(usersToInterests, eq(users.id, usersToInterests.userId))
            .leftJoin(userRoles, eq(users.id, userRoles.userId))
            .leftJoin(roles, eq(userRoles.roleId, roles.id))
            .where(
                and(
                    eq(users.buuddyMode, true),
                    isNotNull(profiles.id),
                    name ? eq(users.name, name) : undefined,
                    interests.length > 0 ? inArray(usersToInterests.interestId, interests) : undefined
                )
            )
            .groupBy(users.id, profiles.id, userRoles.id, roles.id);

        type BuuddiesPartialSelect = typeof buuddies[number];

        const result = buuddies.reduce<Record<string, { user: BuuddiesPartialSelect["user"], profile: BuuddiesPartialSelect["profile"], userRoles: BuuddiesPartialSelect["userRole"][] }>>(
            (acc, row) => {
                const user = row.user;
                const profile = row.profile;
                const userRole = row.userRole;

                if (!acc[user.id]) {
                    acc[user.id] = { user, profile, userRoles: [] };
                }

                if (userRole.id) {
                    acc[user.id]?.userRoles.push(userRole);
                }

                return acc;
            },
            {}
        );

        return result;
    }
}

export default UserService;