import { z } from "zod";
import {
	messageRoleEnum,
	paymentTypeEnum,
	suscriptionEnum,
} from "~/server/db/schema";

const paymentType = z.enum(paymentTypeEnum.enumValues);
export type PaymentType = z.infer<typeof paymentType>;

const messageRole = z.enum(messageRoleEnum.enumValues);
export type MessageRole = z.infer<typeof messageRole>;

const subscription = z.enum(suscriptionEnum.enumValues);
export type Subscription = z.infer<typeof subscription>;
