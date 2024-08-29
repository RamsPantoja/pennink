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
  const {
    bookingRequestFilters,
    onChangeFilters,
  } = useBookingRequestManagerLogic();

  return (
    <Card className="flex flex-col gap-4 w-full">
      <BookingRequestFilters
        filters={bookingRequestFilters}
        onChangeFilters={onChangeFilters}
      />
      {bookingRequestFilters.bookingRequestType === "INBOX" &&
        (
          <BookingRequestBuuddyList
            receiverId={session.user.id}
            filters={bookingRequestFilters}
          />
        )}
      {bookingRequestFilters.bookingRequestType === "SENT" &&
        (
          <BookingRequests
            senderId={session.user.id}
            filters={bookingRequestFilters}
          />
        )}
    </Card>
  );
};

export default BookingRequestManager;
