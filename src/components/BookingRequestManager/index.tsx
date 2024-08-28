import { type Session } from "next-auth";
import { Card } from "../ui/card";
import BookingRequestFilters from "./BookingRequestFilters";
import BookingRequestBuuddyList from "./BookingRequests/BookingRequestBuuddyList";
import useBookingRequestManagerLogic from "./useBookingRequestManagerLogic";

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
    </Card>
  );
};

export default BookingRequestManager;
