import { api } from "~/utils/api";
import { type BookingRequestFilters } from "../BookingRequestFilters";

type UseBookingRequestLogicProps = {
  senderId: string;
  filters: BookingRequestFilters;
};

const useBookingRequestLogic = ({
  senderId,
  filters,
}: UseBookingRequestLogicProps) => {
  const {
    data: bookingRequestsData,
    isError: bookingRequestsIsError,
    isLoading: bookingRequestsIsLoading,
  } = api.bookingRequest.bookingRequestsBySender.useQuery({
    senderId,
    status: filters.status,
  });

  return {
    bookingRequestsData,
    bookingRequestsIsError,
    bookingRequestsIsLoading,
  };
};

export default useBookingRequestLogic;
