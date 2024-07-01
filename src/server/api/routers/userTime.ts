import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";
import { WhereUserTimesInputSchema, createUserTimesInputSchema } from "../schemas/userTime";

export const userTimeRouter = createTRPCRouter({
    update: protectedProcedure
        .input(createUserTimesInputSchema)
        .mutation(async ({ input, ctx }) => {
            return await ctx.services({ ctx }).userTimeService.update(input, ctx.session);
        }),
    userTimes: publicProcedure
        .input(WhereUserTimesInputSchema)
        .query(async ({ input, ctx }) => {
            return await ctx.services({ ctx }).userTimeService.getUserTimes(input);
        })
});