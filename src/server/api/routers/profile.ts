import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";
import { buuddyProfileInputSchema, updateProfileInputSchema } from "../schemas/profile";

export const profileRouter = createTRPCRouter({
    upsert: protectedProcedure
        .input(updateProfileInputSchema)
        .mutation(async ({ input, ctx }) => {
            return await ctx.services({ ctx }).profileService.upsert(input, ctx.session);
        }),
    userProfile: protectedProcedure
        .query(async ({ ctx }) => {
            return await ctx.services({ ctx }).profileService.getUserProfile(ctx.session);
        }),
    buuddyProfile: publicProcedure
        .input(buuddyProfileInputSchema)
        .query(async ({ input, ctx }) => {
            return await ctx.services({ ctx }).profileService.getBuuddy(input);
        })
});