import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";
import { buuddiesInputSchema, buuddyModeUserInputSchema, getUserByIdInputSchema } from "../schemas/user";

export const userRouter = createTRPCRouter({
    buuddyMode: protectedProcedure
        .input(buuddyModeUserInputSchema)
        .mutation(async ({ input, ctx }) => {
            return await ctx.services({ ctx }).userService.updateBuuddyMode(input, ctx.session);
        }),
    userById: protectedProcedure
        .input(getUserByIdInputSchema)
        .query(async ({ input, ctx }) => {
            return await ctx.services({ ctx }).userService.getUserById(input);
        }),
    buuddies: publicProcedure
        .input(buuddiesInputSchema)
        .query(async ({ input, ctx }) => {
            return await ctx.services({ ctx }).userService.getBuuddies(input);
        })
});