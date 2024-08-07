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
import useBookingRequestFormLogic from "./useBookingRequestFormLogic";
import { Textarea } from "~/components/ui/textarea";
import InputFeedbackMessage from "~/components/common/InputFeedbackMessage";

type BookingRequestFormProps = {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  time: string | null;
  date: Date | undefined;
  buuddyId: string;
  senderId: string;
  senderTimezoneIANA: string;
  buuddyTimezoneIANA: string;
  userRoleId: string;
};

const BookingRequestForm = ({
  open,
  onOpenChange,
  time,
  date,
  buuddyId,
  senderId,
  senderTimezoneIANA,
  buuddyTimezoneIANA,
  userRoleId,
}: BookingRequestFormProps) => {
  const { useBookingRequestForm, onSubmit, createBookingRequestIsPending } =
    useBookingRequestFormLogic({
      onOpenChange,
      time,
      date,
      buuddyId,
      senderId,
      senderTimezoneIANA,
      buuddyTimezoneIANA,
      userRoleId,
    });

  const {
    register,
    formState: { errors },
  } = useBookingRequestForm;

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
          <DialogTitle>Send a booking request to the buuddy</DialogTitle>
          <DialogDescription>
            Your request will be sent to the buuddy and you will be notified
            when they accept it.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-mochaText">
              Message to buuddy (optional)
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
              disabled={createBookingRequestIsPending}
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
            isPending={createBookingRequestIsPending}
          >
            Send
          </BuuddyButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingRequestForm;
