import { ClockIcon } from "@heroicons/react/24/outline";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip";
import Interval from "./Interval";
import { type WeekDay } from "../useAvailableHours";


type WeeklyDayProps = {
    weekDay: WeekDay
}

const WeeklyDay = ({ weekDay }: WeeklyDayProps) => {
    return (
        <div className="flex flex-col gap-2 min-w-60">
            <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                    <Checkbox
                        id="allowed"
                        onCheckedChange={(checked) => {
                            if (typeof checked === "boolean") {
                                console.log(checked);
                            }
                        }}
                        defaultChecked={weekDay.isActive}
                    />
                    <span className="font-bold">{weekDay.label}</span>
                </div>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant='ghost'
                            size='icon'
                        >
                            <ClockIcon className="min-w-5 h-5 text-blackMain" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent className=" bg-blackMain border-none max-w-60">
                        <p className="text-whiteMain">Nuevo intervalo para Domingo</p>
                    </TooltipContent>
                </Tooltip>
            </div>
            <div className="flex flex-col gap-2">
                {
                    weekDay.intevals.map((item, index) => {
                        return (
                            <Interval
                                key={index}
                            />
                        )
                    })
                }
            </div>
        </div>
    )
}

export default WeeklyDay;