import { z } from "zod";
import { bookingRequestStatusEnum } from "~/server/db/schema";

export const createBookingRequestInputSchema = z.object({
  senderId: z.string().uuid(),
  receiverId: z.string().uuid(),
  senderTimezoneIANA: z.string(),
  receiverTimezoneIANA: z.string(),
  message: z.string().trim().optional(),
  bookingTime: z.string(),
  bookingDate: z.date(),
  userRoleId: z.string().uuid(),
});

export const bookingRequestsBySenderInputSchema = z.object({
  senderId: z.string().uuid(),
  status: z.enum(bookingRequestStatusEnum.enumValues),
});

export const bookingRequestsByReceiverInputSchema = z.object({
  receiverId: z.string().uuid(),
  status: z.enum(bookingRequestStatusEnum.enumValues),
});
