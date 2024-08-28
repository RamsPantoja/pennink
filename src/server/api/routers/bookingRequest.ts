import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

import {
  bookingRequestsByReceiverInputSchema,
  bookingRequestsBySenderInputSchema,
  createBookingRequestInputSchema,
} from "../schemas/bookingRequest";

export const bookingRequestRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createBookingRequestInputSchema)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services({ ctx }).bookingRequestService.create(input);
    }),
  bookingRequestsBySender: protectedProcedure
    .input(bookingRequestsBySenderInputSchema)
    .query(async ({ input, ctx }) => {
      return await ctx
        .services({ ctx })
        .bookingRequestService.getBookingRequestsBySenderId(input.senderId);
    }),
  bookingRequestsByReceiver: protectedProcedure
    .input(bookingRequestsByReceiverInputSchema)
    .query(async ({ input, ctx }) => {
      return await ctx
        .services({ ctx })
        .bookingRequestService.getBookingRequestsByReceiverId(input);
    }),
});
