import {
    createTRPCRouter,
    protectedProcedure,
} from "~/server/api/trpc";

export const weeklyDaysRouter = createTRPCRouter({
    weeklyDays: protectedProcedure.query(async ({ ctx }) => {
        return await ctx.services({ ctx }).weeklyDaysService.getAll();
    }),
});