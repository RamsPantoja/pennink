import {
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { createUserRoleInputSchema, getUserRoleByIdInputSchema } from "../schemas/useRole";

export const userRoleRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createUserRoleInputSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services({ ctx }).userRoleService.create(input, ctx.session);
    }),
  userRoles: protectedProcedure
    .query(async ({ ctx }) => {
      return await ctx.services({ ctx }).userRoleService.getUserRoles(ctx.session);
    }),
  userRoleById: protectedProcedure
    .input(getUserRoleByIdInputSchema)
    .query(async ({ input, ctx }) => {
      return await ctx.services({ ctx }).userRoleService.getUserRoleById(input.id)
    })
});