import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { shiftTimeInterval } from "~/lib/utils";
import { type RouterOutputs } from "~/utils/api";
import { useSession } from "next-auth/react";

type UseTimeListLogicProps = {
  time: RouterOutputs["userTime"]["userTimes"][number];
  selectedDate: Date | undefined;
};

const useTimeListLogic = ({ time, selectedDate }: UseTimeListLogicProps) => {
  const [displaySendBookingRequestForm, setDisplaySentBookingRequest] =
    useState<boolean>(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [displaySignInWarning, setDisplaySignInWarning] =
    useState<boolean>(false);
  const { data: session } = useSession();

  const times: string[] = useMemo(() => {
    const convertTo12HourFormat = (hour: number): string => {
      const period = hour < 12 || hour === 24 ? "AM" : "PM";
      const adjustedHour = hour % 12 || 12;
      return `${adjustedHour}:00 ${period}`;
    };

    if (selectedDate && time) {
      const generateTimeArray = (interval: {
        startTime: string;
        endTime: string;
      }): string[] => {
        const { startTime, endTime } = interval;
        const startHour = parseInt(startTime.split(":")[0]!, 10);
        const endHour = parseInt(endTime.split(":")[0]!, 10);
        const times: string[] = [];

        const timeInSourceTimezone = DateTime.fromMillis(
          selectedDate.getTime(),
          {
            zone: time.timezoneIANA,
          },
        );

        const timeInTargetTimezone = timeInSourceTimezone.setZone(
          Intl.DateTimeFormat().resolvedOptions().timeZone,
        );

        const hoursDiff =
          (timeInTargetTimezone.offset - timeInSourceTimezone.offset) / 60;

        const getCurrentHour = (): number => {
          const currentDate = new Date();
          const currentHour = currentDate.getHours();
          return currentHour;
        };

        const currentHour = getCurrentHour();

        const isDifferentDay = (date1: Date, date2: Date): boolean => {
          return (
            date1.getFullYear() !== date2.getFullYear() ||
            date1.getMonth() !== date2.getMonth() ||
            date1.getDate() !== date2.getDate()
          );
        };

        const { newStartTime, newEndTime } = shiftTimeInterval(
          startHour,
          endHour,
          hoursDiff,
        );

        for (let hour = newStartTime; hour <= newEndTime; hour++) {
          if (isDifferentDay(new Date(), selectedDate)) {
            times.push(convertTo12HourFormat(hour));
          } else {
            if (hour > currentHour) {
              times.push(convertTo12HourFormat(hour));
            }
          }
        }

        return times;
      };

      const formatedTimes = generateTimeArray({
        startTime: time.startTime,
        endTime: time.endTime,
      });

      return formatedTimes;
    } else {
      return [];
    }
  }, [time, selectedDate]);

  const onDisplayBookingRequestForm = (time: string) => {
    if (session) {
      setSelectedTime(time);
      setDisplaySentBookingRequest(true);
    } else {
      setDisplaySignInWarning(true);
    }
  };

  const onCloseBookingRequestForm = (open: boolean) => {
    setDisplaySentBookingRequest(open);
    setSelectedTime(null);
  };

  return {
    times,
    displaySendBookingRequestForm,
    setDisplaySentBookingRequest,
    onDisplayBookingRequestForm,
    onCloseBookingRequestForm,
    selectedTime,
    displaySignInWarning,
    setDisplaySignInWarning,
  };
};

export default useTimeListLogic;
