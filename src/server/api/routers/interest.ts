import {
    createTRPCRouter,
    publicProcedure,
} from "~/server/api/trpc";

export const interestRouter = createTRPCRouter({
    interests: publicProcedure.query(async ({ ctx }) => {
        return await ctx.services({ ctx }).interestService.getAll();
    }),
});