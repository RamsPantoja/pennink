import { ClockIcon } from "@heroicons/react/24/outline";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import { type WeekDay } from "../useAvailableHours";
import { type WeeklyDays } from "~/lib/enum";
import { cn } from "~/lib/utils";
import Interval from "./Interval";
import useWeeklyDayLogic from "./useWeeklyDayLogic";

type WeeklyDayProps = {
    weekDay: WeekDay
    onCheckDay: (keyDay: WeeklyDays, value: boolean) => void
}

const WeeklyDay = ({ weekDay, onCheckDay }: WeeklyDayProps) => {
    const {
        onRemoveInterval,
        onAddInterval,
        intervals,
        control
    } = useWeeklyDayLogic({ keyDay: weekDay.key, isActive: weekDay.isActive });

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
                                onClick={async () => {
                                    await onAddInterval();
                                }}
                            >
                                <ClockIcon className="min-w-5 h-5 text-blackMain" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent className=" bg-blackMain border-none max-w-60">
                            <p className="text-whiteMain">Nuevo intervalo para {weekDay.key}</p>
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
                                    onRemove={async () => {
                                        await onRemoveInterval(item.id);
                                    }}
                                    control={control}
                                    index={index}
                                />
                            )
                        })
                    }
                </div>
            }
        </div>
    )
}

export default WeeklyDay;