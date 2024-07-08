import {
    createTRPCRouter,
    protectedProcedure,
} from "~/server/api/trpc";
import { updateProfileInputSchema } from "../schemas/profile";

export const profileRouter = createTRPCRouter({
    upsert: protectedProcedure
        .input(updateProfileInputSchema)
        .mutation(async ({ input, ctx }) => {
            return await ctx.services({ ctx }).profileService.upsert(input, ctx.session);
        }),
    userProfile: protectedProcedure
        .query(async ({ ctx }) => {
            return await ctx.services({ ctx }).profileService.getUserProfile(ctx.session);
        })
});