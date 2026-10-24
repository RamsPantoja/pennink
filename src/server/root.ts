import {
	createCallerFactory,
	createTRPCRouter,
	type TRPCContext,
} from "~/server/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import { userRouter } from "./api/routers/user";
import { paymentRouter } from "./api/routers/payment";
import { workspaceRouter } from "./api/routers/workspace";
import { chatRouter } from "./api/routers/chat";
import { noteRouter } from "./api/routers/note";
import { storageRouter } from "./api/routers/storage";
import { subscriptionRouter } from "./api/routers/subscription";
import { feedbackRouter } from "./api/routers/feedback";
import { formRouter } from "./api/routers/form";
import { linkRouter } from "./api/routers/link";
import { classroomRouter } from "./api/routers/classroom";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	user: userRouter,
	payment: paymentRouter,
	workspace: workspaceRouter,
	chat: chatRouter,
	note: noteRouter,
	storage: storageRouter,
	subscription: subscriptionRouter,
	feedback: feedbackRouter,
	form: formRouter,
	link: linkRouter,
	classroom: classroomRouter,
});

export const createCaller = (ctx: TRPCContext) => {
	const caller = createCallerFactory(appRouter);
	return caller(ctx);
};

// export type definition of API
export type AppRouter = typeof appRouter;
export type RouterOutput = inferRouterOutputs<AppRouter>;
