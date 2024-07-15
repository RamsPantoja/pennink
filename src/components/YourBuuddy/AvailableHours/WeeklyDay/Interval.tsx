import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "~/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import useYourBuuddyStore from "../../useYourBuuddyStore";
import { type Control, Controller } from "react-hook-form";
import { type TInterval, type IntervalsValidationSchema } from "./useWeeklyDayLogic";
import InputFeedbackMessage from "~/components/common/InputFeedbackMessage";
import { useMemo } from "react";

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
    onChange: (intervalId: string, value: string, key: keyof TInterval) => void
    id: string
}

const Interval = ({ onRemove, control, index, onChange, id }: IntervalProps) => {
    const userRoles = useYourBuuddyStore((state) => state.userRoles);

    const error = useMemo(() => {
        if (control._formState.errors && control._formState.errors.intervals) {
            return control._formState.errors.intervals[index];
        }
    }, [control, index]);

    return (
        <div className="flex flex-col gap-1">
            <div className="flex gap-2 items-center">
                <Controller
                    render={({ field, fieldState }) => <Select
                        onValueChange={(value) => {
                            onChange(id, value, "userRoleId");
                        }}
                        defaultValue={field.value}
                    >
                        <SelectTrigger status={fieldState.error && "ERROR"} ref={field.ref} className=" min-w-28 max-w-28">
                            <SelectValue placeholder="Role" />
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
                        render={({ field }) =>
                            <Select
                                onValueChange={(value) => {
                                    onChange(id, value, "startTime");
                                }}
                                defaultValue={field.value}
                            >
                                <SelectTrigger status={error && "ERROR"} ref={field.ref} className=" w-24">
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
                        name={`intervals.${index}.startTime`}
                        control={control}
                    />
                    <span className="font-black text-lg">-</span>
                    <Controller
                        render={({ field }) =>
                            <Select
                                onValueChange={(value) => {
                                    onChange(id, value, "endTime");
                                }}
                                defaultValue={field.value}
                            >
                                <SelectTrigger status={error && "ERROR"} ref={field.ref} className="w-24">
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
                        name={`intervals.${index}.endTime`}
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
            {
                error && <InputFeedbackMessage status="ERROR" message={error.message} />
            }
        </div>

    )
}

export default Interval;