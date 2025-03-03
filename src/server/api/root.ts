import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import { userRouter } from "./routers/user";
import { paymentRouter } from "./routers/payment";
import { notebookRouter } from "./routers/notebook";
import { chatRouter } from "./routers/chat";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	user: userRouter,
	payment: paymentRouter,
	notebook: notebookRouter,
	chat: chatRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */

export const createCaller = createCallerFactory(appRouter);
export type RouterOutput = inferRouterOutputs<AppRouter>;
