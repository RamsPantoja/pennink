import { z } from "zod";

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
  id: z.string().uuid(),
});

export const bookingRequestsByReceiverInputSchema = z.object({
  id: z.string().uuid(),
});
