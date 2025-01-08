import { BuuddyButton } from "~/components/common/BuuddyButton";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import useBookingRequestRejectFormLogic from "./useBookingRequestRejectFormLogic";
import { Textarea } from "~/components/ui/textarea";
import InputFeedbackMessage from "~/components/common/InputFeedbackMessage";

type BookingRequestRejectFormProps = {
	open: boolean;
	onOpenChange: (value: boolean) => void;
	bookingRequestId: string;
	onSuccess: () => void;
};

const BookingRequestRejectForm = ({
	open,
	onOpenChange,
	bookingRequestId,
	onSuccess,
}: BookingRequestRejectFormProps) => {
	const {
		useBookingRequestRejectForm,
		onSubmit,
		rejectBookingRequestMutationIsPending,
	} = useBookingRequestRejectFormLogic({
		bookingRequestId,
		onSuccess,
	});

	const {
		register,
		formState: { errors },
	} = useBookingRequestRejectForm;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				onEscapeKeyDown={(e) => {
					e.preventDefault();
				}}
				onCloseAutoFocus={(e) => {
					e.preventDefault();
				}}
				onInteractOutside={(e) => {
					e.preventDefault();
				}}
			>
				<DialogHeader>
					<DialogTitle>Are you sure?</DialogTitle>
					<DialogDescription>
						You can provide a message to the client explaining why you are
						rejecting the booking request.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1">
						<span className="text-sm font-bold text-mochaText">
							Message to client (optional)
						</span>
						<Textarea
							placeholder="Type here..."
							className="resize-none"
							rows={6}
							{...register("message")}
							status={errors.message && "ERROR"}
						/>
						{errors.message && (
							<InputFeedbackMessage
								status="ERROR"
								message={errors.message.message}
							/>
						)}
					</div>
				</div>
				<DialogFooter className="flex flex-row items-center justify-between gap-2">
					<DialogClose asChild>
						<BuuddyButton
							disabled={rejectBookingRequestMutationIsPending}
							onClick={() => {
								onOpenChange(false);
							}}
							type="button"
							variant="secondary"
						>
							Discard
						</BuuddyButton>
					</DialogClose>
					<BuuddyButton
						onClick={onSubmit}
						variant="default"
						isPending={rejectBookingRequestMutationIsPending}
					>
						Reject
					</BuuddyButton>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default BookingRequestRejectForm;
