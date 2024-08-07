import { api } from "~/utils/api";

type UseBookingRequestListLogicProps = {
  receiverId: string;
};

const useBookingRequestBuuddyListLogic = ({
  receiverId,
}: UseBookingRequestListLogicProps) => {
  const {
    data: bookingRequestsData,
    isError: bookingRequestsIsError,
    isLoading: bookingRequestsIsLoading,
  } = api.bookingRequest.bookingRequestsByReceiver.useQuery({
    id: receiverId,
  });

  return {
    bookingRequestsData,
    bookingRequestsIsError,
    bookingRequestsIsLoading,
  };
};

export default useBookingRequestBuuddyListLogic;
