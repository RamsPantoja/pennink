import { z } from "zod";
import { messageRoleEnum, paymentTypeEnum } from "~/server/db/schema";

const paymentType = z.enum(paymentTypeEnum.enumValues);
export type PaymentType = z.infer<typeof paymentType>;

const messageRole = z.enum(messageRoleEnum.enumValues);
export type MessageRole = z.infer<typeof messageRole>;
