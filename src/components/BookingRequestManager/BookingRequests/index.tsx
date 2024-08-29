import { Card } from "~/components/ui/card";
import { type BookingRequestFilters } from "../BookingRequestFilters";
import BookingRequestCard from "./BookingRequestCard";
import useBookingRequestLogic from "./useBookingRequestLogic";
import { Fragment } from "react";
import { mapSkeletons } from "~/lib/utils";
import BookingRequestBuuddyCardSkeleton from "../BuuddyBookingRequests/BookingRequestBuuddyCard/BookingRequestBuuddyCardSkeleton";
import FeedbackMessage from "~/components/common/FeedbackMessage";

type BookingRequestsProps = {
  senderId: string;
  filters: BookingRequestFilters;
};

const BookingRequests = ({ senderId, filters }: BookingRequestsProps) => {
  const {
    bookingRequestsData,
    bookingRequestsIsError,
    bookingRequestsIsLoading
  } = useBookingRequestLogic({ senderId, filters });

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
        bookingRequestsData?.map((item) => {
          return (
            <BookingRequestCard
              key={item.id}
              bookingDate={item.bookingDate}
              bookingTime={item.bookingTime}
              message={item.message}
              receiverName={item.receiver.name}
              receiverAvatar={item.receiver.image}
              receiverHeadline={item.receiver.profile.headline}
              receiverUsername={item.receiver.profile.username}
            />
          );
        })}
      {!bookingRequestsIsLoading &&
        !bookingRequestsIsError &&
        bookingRequestsData?.length === 0 && (
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
  )
}

export default BookingRequests;