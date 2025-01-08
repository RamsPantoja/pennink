import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/utils/api";

type UseBookingRequestBuuddyCardLogicProps = {
	bookingRequestId: string;
};

const useBookingRequestBuuddyCardLogic = ({
	bookingRequestId,
}: UseBookingRequestBuuddyCardLogicProps) => {
	const [displayRejectDialog, setDisplayRejectDialog] =
		useState<boolean>(false);

	const utils = api.useUtils();

	const {
		mutate: acceptBookingRequestMutation,
		isPending: acceptBookingRequestMutationIsPending,
	} = api.bookingRequest.accept.useMutation({
		onSuccess: async () => {
			toast.success(
				"The booking request has been accepted and is waiting for the client to pay!",
			);
			await utils.bookingRequest.bookingRequestsByReceiver.invalidate();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const handleAccept = () => {
		acceptBookingRequestMutation({
			id: bookingRequestId,
		});
	};

	return {
		displayRejectDialog,
		setDisplayRejectDialog,
		handleAccept,
		acceptBookingRequestMutationIsPending,
	};
};

export default useBookingRequestBuuddyCardLogic;
