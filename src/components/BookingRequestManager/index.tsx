import { type Session } from "next-auth";
import { Card } from "../ui/card";
import BookingRequestFilters from "./BookingRequestFilters";
import BookingRequestBuuddyList from "./BuuddyBookingRequests/BookingRequestBuuddyList";
import useBookingRequestManagerLogic from "./useBookingRequestManagerLogic";
import BookingRequests from "./BookingRequests";

type BookingRequestManagerProps = {
	session: Session;
};

const BookingRequestManager = ({ session }: BookingRequestManagerProps) => {
	const { bookingRequestFilters, onChangeFilters } =
		useBookingRequestManagerLogic();

	return (
		<Card className="flex flex-col gap-4 w-full pl-4 pr-4 pt-0 pb-4">
			<BookingRequestFilters
				filters={bookingRequestFilters}
				onChangeFilters={onChangeFilters}
			/>
			<BookingRequests
				senderId={session.user.id}
				filters={bookingRequestFilters}
			/>
		</Card>
	);
};

export default BookingRequestManager;
