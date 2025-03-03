import { z } from "zod";
import { paymentTypeEnum } from "~/server/db/schema";

const paymentType = z.enum(paymentTypeEnum.enumValues);
export type PaymentType = z.infer<typeof paymentType>;
