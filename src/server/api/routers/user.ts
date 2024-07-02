import {
    createTRPCRouter,
    protectedProcedure,
} from "~/server/api/trpc";
import { buuddyModeUserInputSchema, getUserByIdInputSchema } from "../schemas/user";

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
        })
});