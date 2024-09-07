import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

import {
  bookingRequestsByReceiverInputSchema,
  bookingRequestsBySenderInputSchema,
  cancelBookingRequestInputSchema,
  createBookingRequestInputSchema,
} from "../schemas/bookingRequest";

export const bookingRequestRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createBookingRequestInputSchema)
    .mutation(async ({ input, ctx }) => {
      return await ctx
        .services({ ctx })
        .bookingRequestService.create(
          input,
          ctx.services({ ctx }).emailService,
        );
    }),
  bookingRequestsBySender: protectedProcedure
    .input(bookingRequestsBySenderInputSchema)
    .query(async ({ input, ctx }) => {
      return await ctx
        .services({ ctx })
        .bookingRequestService.getBookingRequestsBySenderId(input);
    }),
  bookingRequestsByReceiver: protectedProcedure
    .input(bookingRequestsByReceiverInputSchema)
    .query(async ({ input, ctx }) => {
      return await ctx
        .services({ ctx })
        .bookingRequestService.getBookingRequestsByReceiverId(input);
    }),
  cancel: protectedProcedure
    .input(cancelBookingRequestInputSchema)
    .mutation(async ({ input, ctx }) => {
      return await ctx.services({ ctx }).bookingRequestService.cancel(input.id);
    }),
});
