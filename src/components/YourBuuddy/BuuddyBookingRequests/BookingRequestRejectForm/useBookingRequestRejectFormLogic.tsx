import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { api } from "~/utils/api";

const bookingRequestRejectValidationSchema = z.object({
	message: z
		.string({
			required_error: "Required field",
		})
		.trim()
		.optional(),
});

export type BookingRequestRejectValidationSchema = z.infer<
	typeof bookingRequestRejectValidationSchema
>;

type UseBookingRequestFormLogicProps = {
	bookingRequestId: string;
	onSuccess: () => void;
};

const useBookingRequestRejectFormLogic = ({
	bookingRequestId,
	onSuccess,
}: UseBookingRequestFormLogicProps) => {
	const useBookingRequestRejectForm =
		useForm<BookingRequestRejectValidationSchema>({
			resolver: zodResolver(bookingRequestRejectValidationSchema),
			defaultValues: {
				message: "",
			},
		});

	const utils = api.useUtils();

	const {
		mutate: rejectBookingRequestMutation,
		isPending: rejectBookingRequestMutationIsPending,
	} = api.bookingRequest.reject.useMutation({
		onSuccess: async () => {
			toast.success("The booking request has been rejected!");
			onSuccess();
			await utils.bookingRequest.bookingRequestsByReceiver.invalidate();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const onSubmit = useBookingRequestRejectForm.handleSubmit((data) => {
		rejectBookingRequestMutation({
			id: bookingRequestId,
			message: data.message,
		});
	});

	return {
		useBookingRequestRejectForm,
		onSubmit,
		rejectBookingRequestMutationIsPending,
	};
};

export default useBookingRequestRejectFormLogic;
