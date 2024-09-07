import { type z } from "zod";
import {
  type bookingRequestsByReceiverInputSchema,
  type bookingRequestsBySenderInputSchema,
  type createBookingRequestInputSchema,
} from "../schemas/bookingRequest";
import { type TRPCContext } from "../trpc";
import { bookingRequests } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type EmailService from "./email";
import newBookingRequestEmailTemplate from "../templates/new_booking_request";
import { env } from "~/env";

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

type GetBookingRequestsBySenderIdInput = z.infer<
  typeof bookingRequestsBySenderInputSchema
>;

class BookingRequestService {
  ctx: TRPCContext;

  constructor({ ctx }: BookingRequestServiceContructor) {
    this.ctx = ctx;
  }

  public async create(
    input: CreateBookingRequestInput,
    emailService: EmailService,
  ): Promise<BookingRequest> {
    const [bookingRequest] = await this.ctx.db
      .insert(bookingRequests)
      .values({
        ...input,
      })
      .returning();

    const receiver = await this.ctx.db.query.users.findFirst({
      where: (users, { eq }) => {
        return eq(users.id, input.receiverId);
      },
    });

    const sender = await this.ctx.db.query.users.findFirst({
      where: (users, { eq }) => {
        return eq(users.id, input.senderId);
      },
      with: {
        profile: true,
      },
    });

    if (!receiver) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Receiver not found",
      });
    }

    if (!sender) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Sender not found",
      });
    }

    if (!bookingRequest) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "Fail to create booking request",
      });
    }

    await emailService.send({
      to: [receiver.email],
      from: "Acme <onboarding@resend.dev>", // "Buuddy <no-reply@buuddy.io>"
      subject: "New booking request",
      html: newBookingRequestEmailTemplate({
        bookingDate: input.bookingDate.toLocaleDateString(),
        link: `${env.NEXT_PUBLIC_BASE_URL}/booking_requests`,
        senderName: sender.name,
        bookingTime: input.bookingTime,
        message: input.message ? input.message : "Without message",
        senderAvatar: sender.image,
        senderHeadline: sender.profile.headline,
      }),
    });

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

  public async getBookingRequestsBySenderId(
    input: GetBookingRequestsBySenderIdInput,
  ) {
    const { senderId, status } = input;

    return this.ctx.db.query.bookingRequests.findMany({
      where: (bookingRequests, { eq, and }) => {
        return and(
          eq(bookingRequests.senderId, senderId),
          eq(bookingRequests.status, status),
        );
      },
      with: {
        receiver: {
          with: {
            profile: true,
          },
        },
      },
    });
  }

  public async accept(bookingRequestId: string) {
    const [bookingRequest] = await this.ctx.db
      .update(bookingRequests)
      .set({
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

    //TODO: Sent a email notification to the sender

    return bookingRequest;
  }

  public async reject(bookingRequestId: string) {
    const [bookingRequest] = await this.ctx.db
      .update(bookingRequests)
      .set({
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

    //TODO: Sent a email notification to the sender

    return bookingRequest;
  }

  public async cancel(bookingRequestId: string) {
    const [bookingRequest] = await this.ctx.db
      .update(bookingRequests)
      .set({
        status: "CANCELED",
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
