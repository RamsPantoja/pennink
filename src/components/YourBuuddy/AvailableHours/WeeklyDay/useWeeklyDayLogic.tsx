import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { typeid } from "typeid-js";
import { z } from "zod";
import { type WeeklyDays } from "~/lib/enum";

export type TInterval = {
    id: string
    startHour: string
    endHour: string
    keyDay: WeeklyDays
    userRoleId: string
}

type UseWeeklyDayLogicProps = {
    keyDay: WeeklyDays
    isActive: boolean
}

const intervalSchema = z.object({
    startHour: z.string({
        required_error: "Campo requerido"
    }).min(1, "Campo requerido"),
    endHour: z.string({
        required_error: "Campo requerido"
    }).min(1, "Campo requerido"),
    userRoleId: z.string({
        required_error: "Campo requerido"
    }).min(1, "Campo requerido"),
    id: z.string({
        required_error: "Campo requerido"
    }).min(1, "Campo requerido"),
    keyDay: z.string({
        required_error: "Campo requerido"
    }).min(1, "Campo requerido"),
})

const intervalsValidationSchema = z
    .object({
        intervals: z.array(intervalSchema).min(1)
    });

export type IntervalsValidationSchema = z.infer<typeof intervalsValidationSchema>

const useWeeklyDayLogic = ({ keyDay, isActive }: UseWeeklyDayLogicProps) => {
    const [intervals, setIntervals] = useState<TInterval[]>([]);

    const { control, register, formState, trigger } = useForm<IntervalsValidationSchema>({
        resolver: zodResolver(intervalsValidationSchema),
        defaultValues: {
            intervals: [{
                id: typeid().toUUID(),
                startHour: "",
                endHour: "",
                keyDay,
                userRoleId: ""
            }]
        }
    });

    console.log(formState.errors);

    const { fields, append, remove } = useFieldArray({
        control,
        name: "intervals", // unique name for your Field Array
    });

    useEffect(() => {
        if (isActive && intervals.length === 0) {
            setIntervals([
                {
                    id: typeid().toUUID(),
                    startHour: "",
                    endHour: "",
                    keyDay,
                    userRoleId: ""
                }
            ])
        }
    }, [isActive, keyDay, intervals.length]);

    const onAddInterval = async () => {
        append({
            id: typeid().toUUID(),
            startHour: "",
            endHour: "",
            keyDay,
            userRoleId: ""
        });

        await trigger();
    }

    const onRemoveInterval = async (intervalId: string) => {
        remove(fields.findIndex((item) => item.id === intervalId));
        await trigger();
    }

    return {
        onRemoveInterval,
        onAddInterval,
        intervals: fields,
        register,
        control
    }
}

export default useWeeklyDayLogic;