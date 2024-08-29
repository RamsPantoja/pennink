import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/utils/api";

type useBookingRequestCardLogicProps = {
  bookingRequestId: string;
}

const useBookingRequestCardLogic = ({ bookingRequestId }: useBookingRequestCardLogicProps) => {
  const apiUtils = api.useUtils();
  const [displayCancelAlert, setDisplayCancelAlert] = useState<boolean>(false);

  const {
    mutate: createBookingRequestMutation,
    isPending: createBookingRequestIsPending,
  } = api.bookingRequest.cancel.useMutation({
    onSuccess: async () => {
      toast.success("Booking request canceled successfully");
      setDisplayCancelAlert(false);
      await apiUtils.bookingRequest.bookingRequestsBySender.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onCancel = () => {
    createBookingRequestMutation({ id: bookingRequestId });
  }

  return {
    displayCancelAlert,
    setDisplayCancelAlert,
    createBookingRequestIsPending,
    onCancel
  };
}

export default useBookingRequestCardLogic