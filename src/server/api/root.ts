import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { roleRouter } from "./routers/role";
import { userRoleRouter } from "./routers/userRole";
import { weeklyDaysRouter } from "./routers/weeklyDays";
import { userTimeRouter } from "./routers/userTime";
import { userRouter } from "./routers/user";
import { interestRouter } from "./routers/interest";
import { profileRouter } from "./routers/profile";
import { type inferRouterOutputs } from "@trpc/server";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  role: roleRouter,
  userRole: userRoleRouter,
  weeklyDays: weeklyDaysRouter,
  userTime: userTimeRouter,
  user: userRouter,
  interest: interestRouter,
  profile: profileRouter
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
