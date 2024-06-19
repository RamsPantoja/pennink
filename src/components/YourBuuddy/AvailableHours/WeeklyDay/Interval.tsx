import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "~/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import useYourBuuddyStore from "../../useYourBuuddyStore";
import { type Control, Controller } from "react-hook-form";
import { type IntervalsValidationSchema } from "./useWeeklyDayLogic";

const hoursList: string[] = [
    "00:00",
    "01:00",
    "02:00",
    "03:00",
    "04:00",
    "05:00",
    "06:00",
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
    "23:00",
];


type IntervalProps = {
    onRemove: () => void;
    control: Control<IntervalsValidationSchema>
    index: number
}

const Interval = ({ onRemove, control, index }: IntervalProps) => {
    const userRoles = useYourBuuddyStore((state) => state.userRoles)

    return (
        <div className="flex gap-2 items-center">
            <Controller
                render={({ field, fieldState }) => <Select
                    onValueChange={field.onChange}
                >
                    <SelectTrigger status={fieldState.error && "ERROR"} ref={field.ref} className=" min-w-28 max-w-28">
                        <SelectValue placeholder="Rol" />
                    </SelectTrigger>
                    <SelectContent>
                        {
                            userRoles.map((role) => {
                                return (
                                    <SelectItem key={role.id} value={role.id}>{role.role.name}</SelectItem>
                                )
                            })
                        }
                    </SelectContent>
                </Select>}
                name={`intervals.${index}.userRoleId`}
                control={control}
            />
            <div className="flex gap-1 items-center ">
                <Controller
                    render={({ field, fieldState }) =>
                        <Select
                            onValueChange={field.onChange}
                        >
                            <SelectTrigger status={fieldState.error && "ERROR"} ref={field.ref} className=" w-24">
                                <SelectValue placeholder="Hora" />
                            </SelectTrigger>
                            <SelectContent>
                                {
                                    hoursList.map((hour, index) => {
                                        return (
                                            <SelectItem key={index} value={hour}>{hour}</SelectItem>
                                        )
                                    })
                                }
                            </SelectContent>
                        </Select>
                    }
                    name={`intervals.${index}.startHour`}
                    control={control}
                />
                <span className="font-black text-lg">-</span>
                <Controller
                    render={({ field, fieldState }) =>
                        <Select
                            onValueChange={field.onChange}
                        >
                            <SelectTrigger status={fieldState.error && "ERROR"} ref={field.ref} className="w-24">
                                <SelectValue placeholder="Hora" />
                            </SelectTrigger>
                            <SelectContent>
                                {
                                    hoursList.map((hour, index) => {
                                        return (
                                            <SelectItem key={index} value={hour}>{hour}</SelectItem>
                                        )
                                    })
                                }
                            </SelectContent>
                        </Select>
                    }
                    name={`intervals.${index}.endHour`}
                    control={control}
                />

            </div>
            <div className="min-w-12 flex justify-center">
                <Button
                    size="icon"
                    variant="ghost"
                    onClick={onRemove}
                >
                    <XMarkIcon className="text-blackMain min-w-5 h-5" />
                </Button>
            </div>
        </div>
    )
}

export default Interval;