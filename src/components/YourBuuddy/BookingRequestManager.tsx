import type { Session } from "next-auth";
import { Card } from "../ui/card";
import useBookingRequestManagerLogic from "../BookingRequestManager/useBookingRequestManagerLogic";
import BookingRequestFilters from "../BookingRequestManager/BookingRequestFilters";
import BookingRequestBuuddyList from "./BuuddyBookingRequests/BookingRequestBuuddyList";

type BookingRequestManagerProps = {
	session: Session;
};

const BookingRequestManager = ({ session }: BookingRequestManagerProps) => {
	const { bookingRequestFilters, onChangeFilters } =
		useBookingRequestManagerLogic();

	return (
		<Card className="flex flex-col gap-4 w-full pt-4 pl-1 pr-0 pb-0">
			<BookingRequestFilters
				filters={bookingRequestFilters}
				onChangeFilters={onChangeFilters}
			/>
			<BookingRequestBuuddyList
				receiverId={session.user.id}
				filters={bookingRequestFilters}
			/>
		</Card>
	);
};

export default BookingRequestManager;
