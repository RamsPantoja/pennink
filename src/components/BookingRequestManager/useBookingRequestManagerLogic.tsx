import { useState } from "react";
import { type BookingRequestFilters } from "./BookingRequestFilters";

const useBookingRequestManagerLogic = () => {
  const [bookingRequestFilters, setBookingRequestFilters] = useState<
    BookingRequestFilters
  >({
    bookingRequestType: "INBOX",
    status: "PENDING",
  });

  const onChangeFilters = (filters: BookingRequestFilters) => {
    setBookingRequestFilters(filters);
  };

  return {
    bookingRequestFilters,
    onChangeFilters,
  };
};

export default useBookingRequestManagerLogic;
