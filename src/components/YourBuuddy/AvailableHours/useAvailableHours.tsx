import { useState } from "react";

type Interval = {
    startHour: string
    endHour: string
}

export type WeekDay = {
    isActive: boolean
    key: string
    label: string
    intevals: Interval[]
}

const weeklyDaysInit: WeekDay[] = [
    {
        isActive: false,
        key: "SUN",
        label: "Domingo",
        intevals: [
            {
                startHour: "",
                endHour: ""
            },
        ]
    },
    {
        isActive: false,
        key: "MON",
        label: "Lunes",
        intevals: [
            {
                startHour: "",
                endHour: ""
            },
        ]
    },
    {
        isActive: false,
        key: "TUE",
        label: "Martes",
        intevals: [
            {
                startHour: "",
                endHour: ""
            },
        ]
    },
    {
        isActive: false,
        key: "WED",
        label: "Miercoles",
        intevals: [
            {
                startHour: "",
                endHour: ""
            },
        ]
    },
    {
        isActive: false,
        key: "THU",
        label: "Jueves",
        intevals: [
            {
                startHour: "",
                endHour: ""
            },
        ]
    },
    {
        isActive: false,
        key: "FRI",
        label: "Viernes",
        intevals: [
            {
                startHour: "",
                endHour: ""
            },
        ]
    },
    {
        isActive: false,
        key: "SAT",
        label: "Sabado",
        intevals: [
            {
                startHour: "",
                endHour: ""
            },
        ]
    }
]


const useAvailableHours = () => {
    const [weeklyDays, setWeeklyDays] = useState<WeekDay[]>(weeklyDaysInit);

    return {
        weeklyDays,
        setWeeklyDays
    }
}

export default useAvailableHours;