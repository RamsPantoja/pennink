import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

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
}: UseBookingRequestFormLogicProps) => {
  const useBookingRequestForm = useForm<BookingRequestValidationSchema>({
    resolver: zodResolver(bookingRequestValidationSchema),
    defaultValues: {
      message: "",
    },
  });

  const onSubmit = useBookingRequestForm.handleSubmit((data) => {
    if (time && date) {
      console.log({
        ...data,
        time,
        date,
        buuddyId,
        senderId,
        senderTimezoneIANA,
        buuddyTimezoneIANA,
        userRoleId,
      });
    }
  });

  return {
    useBookingRequestForm,
    onSubmit,
  };
};

export default useBookingRequestFormLogic;
