import { Card } from "~/components/ui/card";
import WeeklyDay from "./WeeklyDay";
import useAvailableHours from "./useAvailableHours";

const AvailableHours = () => {
    const { weeklyDays } = useAvailableHours();

    return (
        <Card className="border w-fit">
            <span className="text-sm font-bold">Horas semanales</span>
            <div className="flex gap-1 flex-col">
                {
                    weeklyDays.map((item, index) => {
                        return (
                            <WeeklyDay
                                key={index}
                                weekDay={item}
                            />
                        )
                    })
                }
            </div>
        </Card>
    )
}

export default AvailableHours;