import { Card } from "~/components/ui/card";
import useBookingRequestBuuddyListLogic from "./useBookingRequestBuuddyListLogic";
import { mapSkeletons } from "~/lib/utils";
import BookingRequestBuuddyCardSkeleton from "./BookingRequestBuuddyCard/BookingRequestBuuddyCardSkeleton";
import { Fragment } from "react";
import BookingRequestBuuddyCard from "./BookingRequestBuuddyCard";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { type BookingRequestFilters } from "../BookingRequestFilters";

type BookingRequestProps = {
  receiverId: string;
  filters: BookingRequestFilters;
};

const BookingRequestBuuddyList = (
  { receiverId, filters }: BookingRequestProps,
) => {
  const {
    bookingRequestsByReceiver,
    bookingRequestsIsError,
    bookingRequestsIsLoading,
  } = useBookingRequestBuuddyListLogic({ receiverId, filters });

  const skeletons = mapSkeletons({
    numberOfSkeletons: 15,
    skeleton: <BookingRequestBuuddyCardSkeleton />,
  });

  return (
    <Card className="flex w-full gap-2 p-0 flex-wrap">
      {bookingRequestsIsLoading &&
        skeletons.map((skeleton, index) => {
          return <Fragment key={index}>{skeleton}</Fragment>;
        })}
      {!bookingRequestsIsLoading &&
        !bookingRequestsIsError &&
        bookingRequestsByReceiver?.map((item) => {
          return (
            <BookingRequestBuuddyCard
              key={item.id}
              bookingDate={item.bookingDate}
              bookingTime={item.bookingTime}
              message={item.message}
              senderName={item.sender.name}
              senderAvatar={item.sender.image}
              senderHeadline={item.sender.profile.headline}
              senderUsername={item.sender.profile.username}
              id={item.id}
              status={item.status}
            />
          );
        })}
      {!bookingRequestsIsLoading &&
        !bookingRequestsIsError &&
        bookingRequestsByReceiver?.length === 0 && (
          <div className="p-4">
            <FeedbackMessage
              status="INFORMATION"
              message="No booking requests found"
            />
          </div>
        )}
      {!bookingRequestsIsLoading && bookingRequestsIsError && (
        <div className="p-4">
          <FeedbackMessage
            status="ERROR"
            message="Something went wrong! Can not get the booking requests"
          />
        </div>
      )}
    </Card>
  );
};

export default BookingRequestBuuddyList;
