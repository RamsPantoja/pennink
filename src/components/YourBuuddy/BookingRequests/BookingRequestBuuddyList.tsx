import { Card } from "~/components/ui/card";
import useBookingRequestBuuddyListLogic from "./useBookingRequestBuuddyListLogic";
import { mapSkeletons } from "~/lib/utils";
import BookingRequestBuuddyCardSkeleton from "./BookingRequestBuuddyCard/BookingRequestBuuddyCardSkeleton";
import { Fragment } from "react";
import BookingRequestBuuddyCard from "./BookingRequestBuuddyCard";
import FeedbackMessage from "~/components/common/FeedbackMessage";

type BookingRequestProps = {
  receiverId: string;
};

const BookingRequestBuuddyList = ({ receiverId }: BookingRequestProps) => {
  const {
    bookingRequestsData,
    bookingRequestsIsError,
    bookingRequestsIsLoading,
  } = useBookingRequestBuuddyListLogic({ receiverId });

  const skeletons = mapSkeletons({
    numberOfSkeletons: 2,
    skeleton: <BookingRequestBuuddyCardSkeleton />,
  });

  return (
    <Card className="flex w-full flex-1 flex-col gap-2">
      <span className="font-bold text-mochaText">Requests</span>
      <div className="flex h-full w-full flex-col gap-2 overflow-auto">
        {bookingRequestsIsLoading &&
          skeletons.map((skeleton, index) => {
            return <Fragment key={index}>{skeleton}</Fragment>;
          })}
        {!bookingRequestsIsLoading &&
          !bookingRequestsIsError &&
          bookingRequestsData?.map((item) => {
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
              />
            );
          })}
        {!bookingRequestsIsLoading &&
          !bookingRequestsIsError &&
          bookingRequestsData?.length === 0 && (
            <div className="p-4">
              <FeedbackMessage
                status="INFORMATION"
                message="Add a new role to start offering your services"
              />
            </div>
          )}
        {!bookingRequestsIsLoading && bookingRequestsIsError && (
          <div className="p-4">
            <FeedbackMessage
              status="ERROR"
              message="Something went wrong! Can not get the roles"
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default BookingRequestBuuddyList;
