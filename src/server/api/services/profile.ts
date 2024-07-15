import { profiles, users, usersToInterests } from "~/server/db/schema";
import { type TRPCContext } from "../trpc";
import { type z } from "zod";
import { type buuddyProfileInputSchema, type updateProfileInputSchema } from "../schemas/profile";
import { type Session } from "next-auth";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

type ProfileServiceContructor = {
    ctx: TRPCContext
}

type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
type BuuddyProfileInput = z.infer<typeof buuddyProfileInputSchema>;

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
                .set({ name, onBoardingCompleted: true })
                .where(eq(users.id, session.user.id))

            await tx.delete(usersToInterests)
                .where(eq(usersToInterests.userId, session.user.id));

            await tx.insert(usersToInterests).values(interests.map((item) => {
                return {
                    userId: session.user.id,
                    interestId: item
                }
            }));

            //Update path
            if (userProfile) {
                const [profile] = await tx.update(profiles)
                    .set({
                        about,
                        gender,
                        headline,
                        educationLevel,
                        experience,
                        website,
                        username,
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
            } else { //Create new profile path
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

    public async getBuuddy(input: BuuddyProfileInput) {
        const { username } = input;

        const profile = await this.ctx.db.query.profiles.findFirst({
            where: (fields, { eq }) => {
                return eq(fields.username, username);
            },
        });

        if (!profile) {
            return null;
        }

        const user = await this.ctx.db.query.users.findFirst({
            where: (fields, { eq }) => {
                return eq(fields.id, profile.userId)
            },
        });

        return {
            profile,
            user
        }
    }
}

export default ProfileService;