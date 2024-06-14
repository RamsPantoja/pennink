import {
    createTRPCRouter,
    publicProcedure,
} from "~/server/api/trpc";

export const roleRouter = createTRPCRouter({
    roles: publicProcedure.query(async ({ ctx }) => {
        return await ctx.services({ ctx }).roleService.getAll();
    }),
});