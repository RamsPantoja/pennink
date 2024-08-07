import { type z } from "zod";
import { type createBookingRequestInputSchema } from "../schemas/bookingRequest";
import { type TRPCContext } from "../trpc";
import { bookingRequests } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";

type BookingRequestServiceContructor = {
  ctx: TRPCContext;
};

export type BookingRequest = typeof bookingRequests.$inferSelect;
export type CreateBookingRequestInput = z.infer<
  typeof createBookingRequestInputSchema
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

  public async getBookingRequestsByReceiverId(receiverId: string) {
    return this.ctx.db.query.bookingRequests.findMany({
      where: (bookingRequests, { eq }) => {
        return eq(bookingRequests.receiverId, receiverId);
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
}

export default BookingRequestService;
