import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { typeid } from "typeid-js";
import { z } from "zod";
import { type WeeklyDays } from "~/lib/enum";
import useYourBuuddyStore from "../../useYourBuuddyStore";
import { compareHours, operateHours } from "~/lib/utils";
import { type IntervalState } from "../useAvailableHours";

export type TInterval = {
    id: string
    startTime: string
    endTime: string
    keyDay: WeeklyDays
    userRoleId: string
    weeklyDayId: string
}

type IntervalError = {
    index: number
    message: string
}

type UseWeeklyDayLogicProps = {
    keyDay: WeeklyDays
    weeklyDayId: string
    initIntervals : TInterval[]
    isActive: boolean
    onChangeIntervals: (keyDay: WeeklyDays, intervalsState: IntervalState) => void
}

export const intervalSchema = z.object({
    startTime: z.string({
        required_error: "Required field"
    }).min(1, "Required field"),
    endTime: z.string({
        required_error: "Required field"
    }).min(1, "Required field"),
    userRoleId: z.string({
        required_error: "Required field"
    }).min(1, "Required field"),
    id: z.string({
        required_error: "Required field"
    }).min(1, "Required field"),
    keyDay: z.string({
        required_error: "Required field"
    }).min(1, "Required field"),
    weeklyDayId: z.string({
        required_error: "Required field"
    }).min(1, "Required field"),
})

const intervalsValidationSchema = z
    .object({
        intervals: z.array(intervalSchema).min(1)
    });

export type IntervalsValidationSchema = z.infer<typeof intervalsValidationSchema>

const useWeeklyDayLogic = ({ keyDay, isActive, onChangeIntervals, weeklyDayId, initIntervals }: UseWeeklyDayLogicProps) => {
    const userRoles = useYourBuuddyStore((state) => state.userRoles);

    const { control, register, setError, clearErrors } = useForm<IntervalsValidationSchema>({
        resolver: zodResolver(intervalsValidationSchema),
        defaultValues: {
            intervals: initIntervals
        }
    });

    const { fields, replace } = useFieldArray({
        control,
        name: "intervals",
    });

    useEffect(() => {
        /**
         * When the weeklyDay is active for first time and there are no intervals added
         * Then we create the first interval and replace the interval array with the new intervals array
         * and finally we update the intervalRecords state from the parent component with the new intervals without error
         */
        if (isActive && fields.length === 0 && userRoles[0]) {
            const intervals: TInterval[] = [{
                id: typeid().toUUID(),
                startTime: "09:00",
                endTime: "17:00",
                keyDay,
                userRoleId: userRoles[0].id,
                weeklyDayId
            }];

            replace(intervals);
            onChangeIntervals(keyDay, { intervals, hasError: false });
        }


        /**
         * if the weeklyDay is activated and exist previous intervals, we run the intervalsValidator method to validate all intervals 
         * and update the intervalRecords state with their errors
         */
        if (isActive && fields.length > 0) {
            intervalsValidator(fields as TInterval[]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isActive, keyDay]);

    const intervalsValidator = (intervals: TInterval[]) => {
        const errors: IntervalError[] = [];

        for (let i = 0; i < intervals.length; i++) {
            const elementI = intervals[i];

            if (elementI) {
                const endTimeLaterThanStartTime = compareHours(elementI.startTime, elementI.endTime);

                if (endTimeLaterThanStartTime !== null && endTimeLaterThanStartTime >= 0) {
                    errors.push({ index: i, message: "Choose an end time later than the start time" });
                } else {
                    const [startTimeHoursI] = elementI.startTime.split(':').map(Number);
                    const [endTimeHoursI] = elementI.endTime.split(':').map(Number);

                    for (let j = 0; j < intervals.length; j++) {
                        if (i !== j) {
                            const elementJ = intervals[j];

                            if (elementJ) {
                                const [startTimeHoursJ]: number[] = elementJ.startTime.split(':').map(Number);
                                const [endTimeHoursJ] = elementJ.endTime.split(':').map(Number);

                                if (
                                    startTimeHoursI !== undefined &&
                                    endTimeHoursI !== undefined &&
                                    startTimeHoursJ !== undefined &&
                                    endTimeHoursJ !== undefined
                                ) {
                                    const intervalOverlap = ((startTimeHoursI >= startTimeHoursJ) && (startTimeHoursI <= endTimeHoursJ)) || ((endTimeHoursI >= startTimeHoursJ) && (endTimeHoursI <= endTimeHoursJ))

                                    if (intervalOverlap) {
                                        errors.push({ index: i, message: "Times overlap" });
                                        errors.push({ index: j, message: "Times overlap" });
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        clearErrors();

        for (const error of errors) {
            setError(`intervals.${error.index}`, { message: error.message });
        }

        onChangeIntervals(keyDay, { intervals, hasError: errors.length > 0 ? true : false });
    }

    const onAddInterval = () => {
        if (userRoles[0]) {
            if (fields.length === 0) {
                const intervals: TInterval[] = [{
                    id: typeid().toUUID(),
                    startTime: "09:00",
                    endTime: "17:00",
                    keyDay,
                    userRoleId: userRoles[0].id,
                    weeklyDayId
                }];

                replace(intervals);
                onChangeIntervals(keyDay, { intervals, hasError: false });
            } else {
                const lastInterval = fields[fields.length - 1];

                if (lastInterval) {
                    const startTime = operateHours(lastInterval.endTime, "01:00", "add");
                    const endTime = operateHours(startTime, "01:00", "add");

                    const newInterval: TInterval = {
                        id: typeid().toUUID(),
                        startTime,
                        endTime,
                        keyDay,
                        userRoleId: userRoles[0].id,
                        weeklyDayId
                    }

                    replace([...fields as TInterval[], newInterval]);

                    intervalsValidator([...fields as TInterval[], newInterval]);
                }
            }
        }
    };

    const onRemoveInterval = (intervalId: string) => {
        const tempIntervals = fields.filter((item) => item.id !== intervalId);
        replace(tempIntervals);
        intervalsValidator(tempIntervals as TInterval[]);
    }

    const onChangeInterval = (intervalId: string, value: string, key: keyof TInterval) => {
        const intervals = fields.map((item) => {
            if (item.id === intervalId) {
                return {
                    ...item,
                    [key]: value
                }
            } else {
                return item;
            }
        });

        replace(intervals);

        intervalsValidator(intervals as TInterval[]);
    };

    return {
        onRemoveInterval,
        onAddInterval,
        intervals: fields,
        register,
        control,
        onChangeInterval
    }
}

export default useWeeklyDayLogic;