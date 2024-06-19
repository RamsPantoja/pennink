import { useEffect, useState } from "react";
import { type WeeklyDays } from "~/lib/enum";
import { api } from "~/utils/api";
import { type TInterval } from "./WeeklyDay/useWeeklyDayLogic";

export type WeekDay = {
    isActive: boolean
    key: WeeklyDays
    label: string
}

type IntervalState = {
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

const useAvailableHours = () => {
    const [weeklyDays, setWeeklyDays] = useState<WeekDay[]>([]);
    const [intervalRecords, setIntervalRecords] = useState<IntervalRecord>(intervalRecordsInit);
    const { data: weeklyDaysData, isError: weeklyDaysIsError, isLoading: weeklyDaysIsLoading } = api.weeklyDays.weeklyDays.useQuery();

    useEffect(() => {
        if (weeklyDaysData && !weeklyDaysIsError) {
            setWeeklyDays(weeklyDaysData.map((item) => {
                return {
                    isActive: false,
                    key: item.name,
                    label: item.name,
                }
            }))
        }
    }, [weeklyDaysData, weeklyDaysIsError]);

    const onCheckDay = (keyDay: WeeklyDays, value: boolean) => {
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

        setWeeklyDays(tempWeeklyDays);
    }

    const onChangeIntervals = (keyDay: WeeklyDays, intervalsState: IntervalState) => {
        const tempIntervalRecords = { ...intervalRecords };
        tempIntervalRecords[keyDay] = intervalsState;

        setIntervalRecords(tempIntervalRecords);
    }

    const onSaveAvailableHours = () => {
        console.log("save");
    }

    return {
        weeklyDays,
        setWeeklyDays,
        weeklyDaysIsError,
        weeklyDaysIsLoading,
        onCheckDay,
        onChangeIntervals,
        onSaveAvailableHours
    }
}

export default useAvailableHours;