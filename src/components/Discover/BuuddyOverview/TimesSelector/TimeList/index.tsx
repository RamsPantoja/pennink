import { type RouterOutputs } from "~/utils/api";
import TimeCard, { type TimeCardProps } from "../TimeCard";
import { useMemo } from "react";
import { DateTime } from "luxon";
import { shiftTimeInterval } from "~/lib/utils";
import FeedbackMessage from "~/components/common/FeedbackMessage";

type TimeListProps = {
  time: RouterOutputs["userTime"]["userTimes"][number];
  selectedDate: Date | undefined;
};

const TimeList = ({ time, selectedDate }: TimeListProps) => {
  const times: TimeCardProps[] = useMemo(() => {
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

      return formatedTimes.map((item) => {
        return {
          role: time.userRole.role.name,
          hour: item,
        };
      });
    } else {
      return [];
    }
  }, [time, selectedDate]);

  return (
    <div className="flex flex-col gap-4 p-2">
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
            return <TimeCard key={index} hour={item.hour} />;
          })}
      </div>
    </div>
  );
};

export default TimeList;
