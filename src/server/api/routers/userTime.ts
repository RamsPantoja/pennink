import {
    createTRPCRouter,
    protectedProcedure,
} from "~/server/api/trpc";
import { createUserTimesInputSchema } from "../schemas/userTime";

export const userTimeRouter = createTRPCRouter({
    update: protectedProcedure
        .input(createUserTimesInputSchema)
        .mutation(async ({ input, ctx }) => {
            return await ctx.services({ ctx }).userTimeService.update(input, ctx.session);
        }),
});