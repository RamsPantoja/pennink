import { Card } from "~/components/ui/card";
import useAvailableHours from "./useAvailableHours";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { Fragment } from "react";
import { mapSkeletons } from "~/lib/utils";
import WeeklyDaysSkeleton from "./WeeklyDay/WeeklyDaySkeleton";
import { BuuddyButton } from "~/components/common/BuuddyButton";
import WeeklyDayMemo from "./WeeklyDay";

const AvailableHours = () => {
    const {
        weeklyDays,
        weeklyDaysIsError,
        weeklyDaysIsLoading,
        onCheckDay,
        onChangeIntervals,
        onSaveAvailableHours,
        updateUserTimeIsPending,
        intervalsToSave
    } = useAvailableHours();

    const skeletons = mapSkeletons({ numberOfSkeletons: 3, skeleton: <WeeklyDaysSkeleton /> });

    return (
        <Card className="border min-w-[480px] overflow-hidden flex flex-col h-fit gap-2">
            <span className="text-sm font-bold">Horas semanales</span>
            <div className="flex gap-2 flex-col overflow-auto p-2 h-fit">
                {
                    weeklyDaysIsLoading && skeletons.map((skeleton, index) => {
                        return <Fragment key={index}>
                            {skeleton}
                        </Fragment>
                    })
                }
                {
                    !weeklyDaysIsLoading && !weeklyDaysIsError && weeklyDays.map((item) => {
                        return (
                            <WeeklyDayMemo
                                key={item.key}
                                weekDay={item}
                                onCheckDay={onCheckDay}
                                onChangeIntervals={onChangeIntervals}
                            />
                        )
                    })
                }
                {
                    !weeklyDaysIsLoading && !weeklyDaysIsError && weeklyDays.length === 0 &&
                    <div className="p-4">
                        <FeedbackMessage status="INFORMATION" message="No hay días horarios para mostrar" />
                    </div>
                }
                {
                    !weeklyDaysIsLoading &&
                    weeklyDaysIsError &&
                    <div className="p-4">
                        <FeedbackMessage status="ERROR" message="Algo salio mal! No se pueden obtener la configuración de horarios" />
                    </div>
                }
            </div>
            <div className="flex items-center justify-end">
                <BuuddyButton
                    disabled={intervalsToSave.length === 0}
                    onClick={onSaveAvailableHours}
                    className="w-fit"
                    isPending={updateUserTimeIsPending}
                >Guardar</BuuddyButton>
            </div>
        </Card>
    )
}

export default AvailableHours;