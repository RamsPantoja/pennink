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

export const userRouter = createTRPCRouter({});
