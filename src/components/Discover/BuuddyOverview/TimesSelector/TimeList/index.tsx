import { type RouterOutputs } from "~/utils/api";
import TimeCard from "../TimeCard";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import useTimeListLogic from "./useTimeListLogic";
import BookingRequestForm from "../BookingRequestForm";
import { useSession } from "next-auth/react";

type TimeListProps = {
  time: RouterOutputs["userTime"]["userTimes"][number];
  selectedDate: Date | undefined;
};

const TimeList = ({ time, selectedDate }: TimeListProps) => {
  const {
    times,
    displaySendBookingRequestForm,
    onDisplayBookingRequestForm,
    onCloseBookingRequestForm,
    selectedTime,
  } = useTimeListLogic({ time, selectedDate });

  const { data: session, status } = useSession();

  return (
    <div className="flex flex-col gap-4 p-2">
      {status !== "loading" && session && (
        <BookingRequestForm
          open={displaySendBookingRequestForm}
          onOpenChange={onCloseBookingRequestForm}
          time={selectedTime}
          date={selectedDate}
          buuddyId={time.userId}
          senderId={session.user.id}
          senderTimezoneIANA={Intl.DateTimeFormat().resolvedOptions().timeZone}
          buuddyTimezoneIANA={time.timezoneIANA}
          userRoleId={time.userRoleId}
        />
      )}
      <span className="text-sm font-bold text-mochaText">
        {time.userRole.role.name}
      </span>
      <div className="flex flex-col gap-2">
        {times.length === 0 && (
          <FeedbackMessage
            status="INFORMATION"
            message="No available times for this date"
          />
        )}
        {times.length > 0 &&
          times.map((item, index) => {
            return (
              <TimeCard
                key={index}
                hour={item}
                onSendRequest={onDisplayBookingRequestForm}
              />
            );
          })}
      </div>
    </div>
  );
};

export default TimeList;
