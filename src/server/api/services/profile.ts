import { profiles, users, usersToInterests } from "~/server/db/schema";
import { type TRPCContext } from "../trpc";
import { type z } from "zod";
import { type updateProfileInputSchema } from "../schemas/profile";
import { type Session } from "next-auth";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

type ProfileServiceContructor = {
    ctx: TRPCContext
}

type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

class ProfileService {
    ctx: TRPCContext

    constructor({ ctx }: ProfileServiceContructor) {
        this.ctx = ctx;
    }

    public async upsert(input: UpdateProfileInput, session: Session) {
        const {
            name,
            interests,
            experience,
            educationLevel,
            headline,
            about,
            gender,
            website,
            username
        } = input;

        const userProfile = await this.ctx.db.query.profiles.findFirst({
            where: (fields, { eq }) => {
                return eq(fields.userId, session.user.id);
            },
        });

        const result = await this.ctx.db.transaction(async (tx) => {
            await tx.update(users)
                .set({ name })
                .where(eq(users.id, session.user.id))

            await tx.delete(usersToInterests)
                .where(eq(usersToInterests.userId, session.user.id));

            await tx.insert(usersToInterests).values(interests.map((item) => {
                return {
                    userId: session.user.id,
                    interestId: item
                }
            }));


            if (userProfile) {
                const [profile] = await tx.update(profiles)
                    .set({
                        about,
                        gender,
                        headline,
                        educationLevel,
                        experience,
                    })
                    .where(eq(profiles.id, userProfile.id))
                    .returning();

                if (!profile) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: 'Profile can not be updated',
                    });
                }

                return profile;
            } else {
                const [profile] = await tx.insert(profiles).values({
                    about,
                    gender,
                    headline,
                    educationLevel,
                    experience,
                    website,
                    username,
                    userId: session.user.id
                }).returning();

                if (!profile) {
                    throw new TRPCError({
                        code: "CONFLICT",
                        message: 'Profile can not be created',
                    });
                }

                return profile;
            }
        })

        return result;
    }

    public async getUserProfile(session: Session) {
        const profile = await this.ctx.db.query.profiles.findFirst({
            where: (fields, { eq }) => {
                return eq(fields.userId, session.user.id);
            },
        });

        const interests = await this.ctx.db.query.usersToInterests.findMany({
            where: (fields, { eq }) => {
                return eq(fields.userId, session.user.id);
            },
        });

        return {
            profile,
            interests,
            session
        }
    }
}

export default ProfileService;