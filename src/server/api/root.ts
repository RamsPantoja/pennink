import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import type { inferRouterOutputs } from "@trpc/server";
import { userRouter } from "./routers/user";
import { paymentRouter } from "./routers/payment";
import { workspaceRouter } from "./routers/workspace";
import { chatRouter } from "./routers/chat";
import { noteRouter } from "./routers/note";

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
