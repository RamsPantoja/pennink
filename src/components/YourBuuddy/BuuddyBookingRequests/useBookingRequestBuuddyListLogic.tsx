import { bookingRequestsByReceiverAdapter } from "~/adapters";
import type { BookingRequestFilters } from "~/components/BookingRequestManager/BookingRequestFilters";
import { api } from "~/utils/api";

type UseBookingRequestListLogicProps = {
	receiverId: string;
	filters: BookingRequestFilters;
};

const useBookingRequestBuuddyListLogic = ({
	receiverId,
	filters,
}: UseBookingRequestListLogicProps) => {
	const {
		data: bookingRequestsData,
		isError: bookingRequestsIsError,
		isLoading: bookingRequestsIsLoading,
	} = api.bookingRequest.bookingRequestsByReceiver.useQuery({
		receiverId,
		status: filters.status,
	});

	const bookingRequestsByReceiver =
		bookingRequestsByReceiverAdapter(bookingRequestsData);

	return {
		bookingRequestsByReceiver,
		bookingRequestsIsError,
		bookingRequestsIsLoading,
	};
};

export default useBookingRequestBuuddyListLogic;
