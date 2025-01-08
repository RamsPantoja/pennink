import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { shiftTimeInterval } from "~/lib/utils";
import type { RouterOutputs } from "~/utils/api";
import { useSession } from "next-auth/react";

type UseTimeListLogicProps = {
	roleTimes: RouterOutputs["userTime"]["userTimes"][number];
	selectedDate: Date | undefined;
};

const useTimeListLogic = ({
	roleTimes,
	selectedDate,
}: UseTimeListLogicProps) => {
	const [displaySendBookingRequestForm, setDisplaySentBookingRequest] =
		useState<boolean>(false);
	const [selectedTime, setSelectedTime] = useState<string | null>(null);
	const [displaySignInWarning, setDisplaySignInWarning] =
		useState<boolean>(false);
	const { data: session } = useSession();

	const times: number[] = useMemo(() => {
		if (selectedDate && roleTimes) {
			const generateTimeArray = (interval: {
				startTime: string;
				endTime: string;
			}): number[] => {
				const { startTime, endTime } = interval;
				const startHour = Number.parseInt(startTime.split(":")[0]!, 10);
				const endHour = Number.parseInt(endTime.split(":")[0]!, 10);
				const times: number[] = [];

				const timeInSourceTimezone = DateTime.fromMillis(
					selectedDate.getTime(),
					{
						zone: roleTimes.timezoneIANA,
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
						times.push(hour);
					} else {
						if (hour > currentHour) {
							times.push(hour);
						}
					}
				}

				return times;
			};

			const formatedTimes = generateTimeArray({
				startTime: roleTimes.startTime,
				endTime: roleTimes.endTime,
			});

			return formatedTimes;
		}

		return [];
	}, [roleTimes, selectedDate]);

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
