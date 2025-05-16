import {
	createTRPCRouter,
	protectedProcedure,
	publicProcedure,
} from "~/server/api/trpc";
import {
	buuddiesInputSchema,
	buuddyModeUserInputSchema,
	getUserByIdInputSchema,
} from "../schemas/user";

export const userRouter = createTRPCRouter({
	initStatics: protectedProcedure.mutation(async ({ ctx }) => {
		return await ctx
			.services({ ctx })
			.userService.initStatics(ctx.session.user.id);
	}),
	statics: protectedProcedure.query(async ({ ctx }) => {
		return await ctx
			.services({ ctx })
			.userService.getStatics(ctx.session.user.id);
	}),
	resetStatics: protectedProcedure.mutation(async ({ ctx }) => {
		return await ctx
			.services({ ctx })
			.userService.resetStatics(ctx.session.user.id);
	}),
});
