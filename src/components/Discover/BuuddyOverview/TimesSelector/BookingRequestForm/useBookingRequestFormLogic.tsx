import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "~/utils/api";

const bookingRequestValidationSchema = z.object({
  message: z
    .string({
      required_error: "Required field",
    })
    .trim()
    .optional(),
});

export type BookingRequestValidationSchema = z.infer<
  typeof bookingRequestValidationSchema
>;

type UseBookingRequestFormLogicProps = {
  onOpenChange: (open: boolean) => void;
  time: string | null;
  date: Date | undefined;
  buuddyId: string;
  senderId: string;
  senderTimezoneIANA: string;
  buuddyTimezoneIANA: string;
  userRoleId: string;
};

const useBookingRequestFormLogic = ({
  time,
  date,
  buuddyId,
  senderId,
  senderTimezoneIANA,
  buuddyTimezoneIANA,
  userRoleId,
  onOpenChange,
}: UseBookingRequestFormLogicProps) => {
  const useBookingRequestForm = useForm<BookingRequestValidationSchema>({
    resolver: zodResolver(bookingRequestValidationSchema),
    defaultValues: {
      message: "",
    },
  });

  const {
    mutate: createBookingRequestMutation,
    isPending: createBookingRequestIsPending,
  } = api.bookingRequest.create.useMutation({
    onSuccess: async () => {
      toast.success("Booking request sent successfully");
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const onSubmit = useBookingRequestForm.handleSubmit((data) => {
    if (time && date) {
      createBookingRequestMutation({
        bookingTime: time,
        bookingDate: date,
        receiverId: buuddyId,
        senderId,
        senderTimezoneIANA,
        receiverTimezoneIANA: buuddyTimezoneIANA,
        userRoleId,
        message: data.message,
      });
    }
  });

  return {
    useBookingRequestForm,
    onSubmit,
    createBookingRequestIsPending,
  };
};

export default useBookingRequestFormLogic;
