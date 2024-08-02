import { type RouterOutputs } from "~/utils/api";
import TimeCard, { type TimeCardProps } from "../TimeCard";
import { useMemo } from "react";
import { DateTime } from "luxon";

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

        console.log({
          hoursDiff:
            (timeInTargetTimezone.offset - timeInSourceTimezone.offset) / 60,
        });

        console.log(selectedDate);

        const getCurrentHour = (): number => {
          const currentDate = new Date();
          const currentHour = currentDate.getHours();
          return currentHour;
        };

        const isDifferentDay = (date1: Date, date2: Date): boolean => {
          return (
            date1.getFullYear() !== date2.getFullYear() ||
            date1.getMonth() !== date2.getMonth() ||
            date1.getDate() !== date2.getDate()
          );
        };

        const currentHour = getCurrentHour();

        for (let hour = startHour; hour <= endHour; hour++) {
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
    <div className="flex flex-col gap-2">
      {times.map((item, index) => {
        return <TimeCard key={index} role={item.role} hour={item.hour} />;
      })}
    </div>
  );
};

export default TimeList;
