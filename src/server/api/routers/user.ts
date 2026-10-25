import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import { updateLocaleInputSchema } from "../schemas/user";

export const userRouter = createTRPCRouter({
	updateLocale: protectedProcedure
		.input(updateLocaleInputSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.userService.updateLocale(ctx.session.user.id, input.locale);
		}),
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
