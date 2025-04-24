import { z } from "zod";
import { messageRoleEnum, subscriptionEnum } from "~/server/db/schema";

const messageRole = z.enum(messageRoleEnum.enumValues);
export type MessageRole = z.infer<typeof messageRole>;

const subscription = z.enum(subscriptionEnum.enumValues);
export type Subscription = z.infer<typeof subscription>;
