import type { z } from "zod";
import type {
	acceptBookingRequestInputSchema,
	bookingRequestsByReceiverInputSchema,
	bookingRequestsBySenderInputSchema,
	createBookingRequestInputSchema,
	rejectBookingRequestInputSchema,
} from "../schemas/bookingRequest";
import type { TRPCContext } from "../trpc";
import { bookingRequests } from "~/server/db/schema";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import type EmailService from "./email";
import newBookingRequestEmailTemplate from "../templates/new_booking_request";
import { env } from "~/env";
import { rejectedBookingRequestEmailTemplate } from "../templates/rejected_booking_request";
import { acceptedBookingRequestEmailTemplate } from "../templates/accepted_booking_request";

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

type RejectBookingRequestInput = z.infer<
	typeof rejectBookingRequestInputSchema
>;

type AcceptBookingRequestInputSchema = z.infer<
	typeof acceptBookingRequestInputSchema
>;

console;
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
			from: "Buuddy <no-reply@buuddy.xyz>",
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
				userRole: {
					with: {
						role: true,
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
				userRole: {
					with: {
						role: true,
					},
				},
			},
		});
	}

	public async accept(
		{ id }: AcceptBookingRequestInputSchema,
		emailService: EmailService,
	) {
		const [bookingRequest] = await this.ctx.db
			.update(bookingRequests)
			.set({
				status: "ACCEPTED",
			})
			.where(eq(bookingRequests.id, id))
			.returning();

		if (!bookingRequest) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Booking request not found",
			});
		}

		const buuddyUser = await this.ctx.db.query.users.findFirst({
			where: (users, { eq }) => {
				return eq(users.id, bookingRequest.receiverId);
			},
			with: {
				profile: true,
			},
		});

		if (!buuddyUser) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Buuddy user not found",
			});
		}

		const clientUser = await this.ctx.db.query.users.findFirst({
			where: (users, { eq }) => {
				return eq(users.id, bookingRequest.senderId);
			},
		});

		if (!clientUser) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Client user not found",
			});
		}

		await emailService.send({
			to: [clientUser.email],
			from: "Buuddy <no-reply@buuddy.xyz>",
			subject: "Booking request accepted",
			html: acceptedBookingRequestEmailTemplate({
				link: `${env.NEXT_PUBLIC_BASE_URL}/booking_requests/booking_request/${id}`,
				buuddyUserImage: buuddyUser.image,
				buuddyHeadline: buuddyUser.profile.headline,
				buuddyName: buuddyUser.name,
			}),
		});

		return bookingRequest;
	}

	public async reject(
		input: RejectBookingRequestInput,
		emailService: EmailService,
	) {
		const { id, message } = input;

		const [bookingRequest] = await this.ctx.db
			.update(bookingRequests)
			.set({
				status: "REJECTED",
			})
			.where(eq(bookingRequests.id, id))
			.returning();

		if (!bookingRequest) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Booking request not found",
			});
		}

		const buuddyUser = await this.ctx.db.query.users.findFirst({
			where: (users, { eq }) => {
				return eq(users.id, bookingRequest.receiverId);
			},
			with: {
				profile: true,
			},
		});

		if (!buuddyUser) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Buuddy user not found",
			});
		}

		const clientUser = await this.ctx.db.query.users.findFirst({
			where: (users, { eq }) => {
				return eq(users.id, bookingRequest.senderId);
			},
		});

		if (!clientUser) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: "Client user not found",
			});
		}

		await emailService.send({
			to: [clientUser.email],
			from: "Buuddy <no-reply@buuddy.xyz>",
			subject: "Booking request rejected",
			html: rejectedBookingRequestEmailTemplate({
				link: `${env.NEXT_PUBLIC_BASE_URL}/booking_requests`,
				message: message ?? "Without message",
				buuddyUserImage: buuddyUser.image,
				buuddyHeadline: buuddyUser.profile.headline,
				buuddyName: buuddyUser.name,
			}),
		});

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

	public async getBookingRequestById(bookingRequestId: string) {
		return this.ctx.db.query.bookingRequests.findFirst({
			where: (bookingRequests, { eq }) => {
				return eq(bookingRequests.id, bookingRequestId);
			},
			with: {
				receiver: {
					with: {
						profile: true,
					},
				},
				userRole: {
					with: {
						role: true,
					},
				},
			},
		});
	}
}

export default BookingRequestService;
