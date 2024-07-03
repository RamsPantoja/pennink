import { useCallback, useEffect, useState } from "react";
import { type WeeklyDays } from "~/lib/enum";
import { api } from "~/utils/api";
import { type TInterval } from "./WeeklyDay/useWeeklyDayLogic";
import { toast } from "sonner";
import { type Session } from "next-auth";

export type WeekDay = {
    isActive: boolean
    key: WeeklyDays
    label: string
    id: string
    initIntervals: TInterval[]
}

export type IntervalState = {
    intervals: TInterval[]
    hasError: boolean
}

type IntervalRecord = Record<WeeklyDays, IntervalState>;

const intervalRecordsInit = {
    MON: {
        intervals: [],
        hasError: false
    },
    TUE: {
        intervals: [],
        hasError: false
    },
    WED: {
        intervals: [],
        hasError: false
    },
    THU: {
        intervals: [],
        hasError: false
    },
    FRI: {
        intervals: [],
        hasError: false
    },
    SUN: {
        intervals: [],
        hasError: false
    },
    SAT: {
        intervals: [],
        hasError: false
    }
}

type UseAvailableHoursProps = {
    session: Session
}

const useAvailableHours = ({ session }: UseAvailableHoursProps) => {
    const [weeklyDays, setWeeklyDays] = useState<WeekDay[]>([]);
    const [intervalRecords, setIntervalRecords] = useState<IntervalRecord>(intervalRecordsInit);
    const [intervalsToSave, setIntervalsToSave] = useState<TInterval[]>([]);
    const [intervalsHaveError, setIntervalsHaveError] = useState<boolean>(false);
    const utils = api.useUtils();
    const { data: weeklyDaysData, isError: weeklyDaysIsError, isLoading: weeklyDaysIsLoading } = api.weeklyDays.weeklyDays.useQuery();
    const { data: userTimesData, isLoading: userTimesIsLoading, isError: userTimesIsError } = api.userTime.userTimes.useQuery({
        userId: session.user.id,
    });

    const { mutate: updateUserTimeMutation, isPending: updateUserTimeIsPending } = api.userTime.update.useMutation({
        onSuccess: async () => {
            toast.success('Tiempos guardados correctamente!');
            await utils.userTime.userTimes.invalidate();
        },
        onError: (error) => {
            toast.error(error.message);
        }
    });

    useEffect(() => {
        if (weeklyDaysData && userTimesData) {
            setWeeklyDays(weeklyDaysData.map((item) => {
                const initIntervals = userTimesData.reduce<TInterval[]>((acc, userTime) => {
                    if (userTime.weeklyDayId === item.id) {
                        const interval: TInterval = {
                            id: userTime.id,
                            startTime: userTime.startTime,
                            endTime: userTime.endTime,
                            keyDay: item.name,
                            userRoleId: userTime.userRoleId,
                            weeklyDayId: userTime.weeklyDayId
                        };

                        acc = [...acc, interval];
                    }

                    return acc;
                }, []);

                return {
                    isActive: initIntervals.length > 0 ? true : false,
                    key: item.name,
                    label: item.name,
                    id: item.id,
                    initIntervals: initIntervals
                }
            }))
        }
    }, [weeklyDaysData, weeklyDaysIsError, userTimesData, userTimesIsError]);

    const getIntervalsByActiveDay = (intevals: TInterval[], weeklyDays: WeekDay[]): TInterval[] => {
        const activeDays = weeklyDays.filter((item) => item.isActive).map((item) => item.key);
        return intevals.filter((interval) => activeDays.includes(interval.keyDay));
    };

    const onCheckDay = useCallback((keyDay: WeeklyDays, value: boolean) => {
        const tempWeeklyDays = weeklyDays.map((item) => {
            if (keyDay === item.key) {
                return {
                    ...item,
                    isActive: value,
                }
            } else {
                return item;
            }
        });


        if (!value) {
            setIntervalsToSave((prev) => {
                return getIntervalsByActiveDay(prev, tempWeeklyDays);
            });
        }

        setWeeklyDays(tempWeeklyDays);
    }, [weeklyDays]);

    const onChangeIntervals = useCallback((keyDay: WeeklyDays, intervalsState: IntervalState) => {
        const activeDays = weeklyDays.filter((item) => item.isActive).map((item) => item.key);

        setIntervalRecords((prev) => {
            let intervals: TInterval[] = [];

            const tempIntervalRecords = { ...prev };
            tempIntervalRecords[keyDay] = intervalsState;

            for (const keyDay of Object.keys(tempIntervalRecords)) {
                if (tempIntervalRecords[keyDay as WeeklyDays].hasError && activeDays.includes(keyDay as WeeklyDays)) {
                    setIntervalsHaveError(true);
                    break;
                } else {
                    setIntervalsHaveError(false);
                    intervals = [...intervals, ...tempIntervalRecords[keyDay as WeeklyDays].intervals];
                }
            };

            setIntervalsToSave(getIntervalsByActiveDay(intervals, weeklyDays));
            return tempIntervalRecords;
        });
    }, [weeklyDays]);

    const onSaveAvailableHours = () => {
        if (!intervalsHaveError && intervalsToSave.length > 0) {
            updateUserTimeMutation({
                intervals: intervalsToSave
            });
        }
    }

    return {
        weeklyDays,
        setWeeklyDays,
        weeklyDaysIsError,
        weeklyDaysIsLoading,
        onCheckDay,
        onChangeIntervals,
        onSaveAvailableHours,
        updateUserTimeIsPending,
        intervalRecords,
        intervalsToSave,
        userTimesIsError,
        userTimesIsLoading
    }
}

export default useAvailableHours;