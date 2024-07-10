import { ClockIcon } from "@heroicons/react/24/outline";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { type IntervalState, type WeekDay } from "../useAvailableHours";
import { type WeeklyDays } from "~/lib/enum";
import { cn } from "~/lib/utils";
import Interval from "./Interval";
import useWeeklyDayLogic from "./useWeeklyDayLogic";
import { memo } from "react";

type WeeklyDayProps = {
    weekDay: WeekDay
    onCheckDay: (keyDay: WeeklyDays, value: boolean) => void
    onChangeIntervals: (keyDay: WeeklyDays, intervalsState: IntervalState) => void
}

const WeeklyDay = ({ weekDay, onCheckDay, onChangeIntervals }: WeeklyDayProps) => {
    const {
        onRemoveInterval,
        onAddInterval,
        intervals,
        control,
        onChangeInterval
    } = useWeeklyDayLogic({
        keyDay: weekDay.key,
        isActive: weekDay.isActive,
        onChangeIntervals,
        weeklyDayId: weekDay.id,
        initIntervals: weekDay.initIntervals
    });

    return (
        <div className="flex flex-col gap-2 min-w-60">
            <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                    <Checkbox
                        id={weekDay.key}
                        onCheckedChange={(checked) => {
                            if (typeof checked === "boolean") {
                                onCheckDay(weekDay.key, checked);
                            }
                        }}
                        defaultChecked={weekDay.isActive}
                    />
                    <label
                        htmlFor={weekDay.key}
                        className={cn([
                            "font-bold",
                            {
                                "text-blackMain": weekDay.isActive,
                                "text-grayMain": !weekDay.isActive
                            }
                        ])}
                    >
                        {weekDay.label}
                    </label>
                </div>
                {
                    weekDay.isActive &&
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant='ghost'
                                size='icon'
                                onClick={() => {
                                    onAddInterval();
                                }}
                            >
                                <ClockIcon className="min-w-5 h-5 text-blackMain" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className=" bg-blackMain border-none max-w-60">
                            <p className="text-whiteMain">New time for {weekDay.key}</p>
                        </TooltipContent>
                    </Tooltip>
                }
            </div>
            {
                weekDay.isActive &&
                <div className="flex flex-col gap-2">
                    {
                        intervals.map((item, index) => {
                            return (
                                <Interval
                                    key={item.id}
                                    id={item.id}
                                    onRemove={() => {
                                        onRemoveInterval(item.id);
                                    }}
                                    control={control}
                                    index={index}
                                    onChange={onChangeInterval}
                                />
                            )
                        })
                    }
                </div>
            }
        </div>
    )
}

const WeeklyDayMemo = memo(WeeklyDay);

export default WeeklyDayMemo;