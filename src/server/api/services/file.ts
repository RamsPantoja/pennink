import type { z } from "zod";
import type { TRPCContext } from "../../trpc";
import { messages, statics } from "~/server/db/schema";
import type { createMessageInputSchema } from "../schemas/chat";
import { TRPCError } from "@trpc/server";
import { DateTime } from "luxon";
import { eq } from "drizzle-orm";

export type Message = typeof messages.$inferSelect;

type ChatConstructor = {
	ctx: TRPCContext;
};

export class File {
	ctx: TRPCContext;

	constructor({ ctx }: ChatConstructor) {
		this.ctx = ctx;
	}
}
