import { type z } from "zod";
import {
  type bookingRequestsByReceiverInputSchema,
  type createBookingRequestInputSchema,
} from "../schemas/bookingRequest";
import { type TRPCContext } from "../trpc";
import { bookingRequests } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

type BookingRequestServiceContructor = {
  ctx: TRPCContext;
};

export type BookingRequest = typeof bookingRequests.$inferSelect;
export type CreateBookingRequestInput = z.infer<
  typeof createBookingRequestInputSchema
>;

type GetBookingRequestsByReceiverIdInput = z.infer<
  typeof bookingRequestsByReceiverInputSchema
>;

class BookingRequestService {
  ctx: TRPCContext;

  constructor({ ctx }: BookingRequestServiceContructor) {
    this.ctx = ctx;
  }

  public async create(
    input: CreateBookingRequestInput,
  ): Promise<BookingRequest> {
    const [bookingRequest] = await this.ctx.db
      .insert(bookingRequests)
      .values({
        ...input,
      })
      .returning();

    if (!bookingRequest) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Fail to create booking request",
      });
    }

    return bookingRequest;
  }

  public async getBookingRequestsByReceiverId(
    input: GetBookingRequestsByReceiverIdInput,
  ) {
    const { receiverId, status } = input;

    return this.ctx.db.query.bookingRequests.findMany({
      where: (bookingRequests, { eq, and }) => {
        return and(
          eq(bookingRequests.receiverId, receiverId),
          eq(bookingRequests.status, status),
        );
      },
      with: {
        sender: {
          with: {
            profile: true,
          },
        },
      },
    });
  }

  public async getBookingRequestsBySenderId(senderId: string) {
    return this.ctx.db.query.bookingRequests.findMany({
      where: (bookingRequests, { eq }) => {
        return eq(bookingRequests.senderId, senderId);
      },
    });
  }

  public async acceptBookingRequest(bookingRequestId: string) {
    const [bookingRequest] = await this.ctx.db.update(bookingRequests).set({
      status: "ACCEPTED",
    })
      .where(eq(bookingRequests.id, bookingRequestId))
      .returning();

    if (!bookingRequest) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Booking request not found",
      });
    }

    return bookingRequest;
  }

  public async rejectBookingRequest(bookingRequestId: string) {
    const [bookingRequest] = await this.ctx.db.update(bookingRequests).set({
      status: "REJECTED",
    })
      .where(eq(bookingRequests.id, bookingRequestId))
      .returning();

    if (!bookingRequest) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Booking request not found",
      });
    }

    return bookingRequest;
  }
}

export default BookingRequestService;
