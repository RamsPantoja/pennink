import {
    createTRPCRouter,
    protectedProcedure,
} from "~/server/api/trpc";
import { createUserRoleInputSchema } from "../schemas/useRole";

export const useRoleRouter = createTRPCRouter({
    create: protectedProcedure
    .input(createUserRoleInputSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services({ ctx }).userRoleService.create(input, ctx.session);
    }),
});