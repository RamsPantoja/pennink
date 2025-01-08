import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

import {
	acceptBookingRequestInputSchema,
	bookingRequestByIdInputSchema,
	bookingRequestsByReceiverInputSchema,
	bookingRequestsBySenderInputSchema,
	cancelBookingRequestInputSchema,
	createBookingRequestInputSchema,
	rejectBookingRequestInputSchema,
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
	bookingRequestsById: protectedProcedure
		.input(bookingRequestByIdInputSchema)
		.query(async ({ input, ctx }) => {
			return await ctx
				.services({ ctx })
				.bookingRequestService.getBookingRequestById(input.id);
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
	reject: protectedProcedure
		.input(rejectBookingRequestInputSchema)
		.mutation(async ({ input, ctx }) => {
			return await ctx
				.services({ ctx })
				.bookingRequestService.reject(
					input,
					ctx.services({ ctx }).emailService,
				);
		}),
	accept: protectedProcedure
		.input(acceptBookingRequestInputSchema)
		.mutation(async ({ input, ctx }) => {
			return await ctx
				.services({ ctx })
				.bookingRequestService.accept(
					input,
					ctx.services({ ctx }).emailService,
				);
		}),
});
