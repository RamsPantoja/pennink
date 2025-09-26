import { createTRPCRouter, protectedProcedure } from "~/server/trpc";
import { createPresignedUrlInputSchema } from "../schemas/storage";

export const storageRouter = createTRPCRouter({
	createPresignedUrl: protectedProcedure
		.input(createPresignedUrlInputSchema)
		.mutation(async ({ ctx, input }) => {
			return await ctx
				.services({ ctx })
				.storageService.createPresignedUrl(input);
		}),
});
