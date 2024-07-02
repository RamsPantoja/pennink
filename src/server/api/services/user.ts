import { type z } from "zod";
import { type TRPCContext } from "../trpc";
import { type getUserByIdInputSchema, type buuddyModeUserInputSchema } from "../schemas/user";
import { type Session } from "next-auth";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

type UserServiceContructor = {
    ctx: TRPCContext
}

type BuuddyModeUserInput = z.infer<typeof buuddyModeUserInputSchema>
type GetUserByIdInput = z.infer<typeof getUserByIdInputSchema>

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
}

export default UserService;