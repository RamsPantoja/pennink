import type { BookingRequestStatus } from "~/lib/enum";
import type { RouterOutputs } from "~/utils/api";

type BookingRequestsByReceiver = {
	id: string;
	bookingDate: Date;
	bookingTime: string;
	receiverTimezone: string;
	message: string | null;
	sender: {
		name: string;
		image: string;
		profile: {
			headline: string;
			username: string;
		};
	};
	status: BookingRequestStatus;
	role: string;
	price: string;
};

const bookingRequestsByReceiverAdapter = (
	input:
		| RouterOutputs["bookingRequest"]["bookingRequestsByReceiver"]
		| undefined,
): BookingRequestsByReceiver[] | undefined => {
	if (input) {
		return input.map((item) => {
			return {
				id: item.id,
				bookingDate: item.bookingDate,
				bookingTime: item.bookingTime,
				receiverTimezone: item.receiverTimezoneIANA,
				message: item.message,
				sender: {
					name: item.sender.name,
					image: item.sender.image,
					profile: {
						headline: item.sender.profile.headline,
						username: item.sender.profile.username,
					},
				},
				status: item.status,
				role: item.userRole.role.name,
				price: item.userRole.hourPrice,
			};
		});
	}
};

export default bookingRequestsByReceiverAdapter;
