import { Card } from "~/components/ui/card";
import useAvailableHours from "./useAvailableHours";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { Fragment } from "react";
import { mapSkeletons } from "~/lib/utils";
import WeeklyDaysSkeleton from "./WeeklyDay/WeeklyDaySkeleton";
import { BuuddyButton } from "~/components/common/BuuddyButton";
import WeeklyDayMemo from "./WeeklyDay";
import { type Session } from "next-auth";
import useYourBuuddyStore from "../useYourBuuddyStore";

type AvailableHoursProps = {
    session: Session
}

const AvailableHours = ({ session }: AvailableHoursProps) => {
    const {
        weeklyDays,
        weeklyDaysIsError,
        weeklyDaysIsLoading,
        onCheckDay,
        onChangeIntervals,
        onSaveAvailableHours,
        updateUserTimeIsPending,
        intervalsToSave,
        userTimesIsError,
        userTimesIsLoading,
    } = useAvailableHours({ session });

    const skeletons = mapSkeletons({ numberOfSkeletons: 3, skeleton: <WeeklyDaysSkeleton /> });
    const userRoles = useYourBuuddyStore((state) => state.userRoles);

    return (
        <Card className="border min-w-[480px] overflow-hidden flex flex-col h-fit gap-2">
            {
                userRoles.length > 0 ? <Fragment>
                    <span className="text-sm font-bold">Weekly hours</span>
                    <div className="flex gap-2 flex-col overflow-auto p-2 h-fit">
                        {
                            (weeklyDaysIsLoading || userTimesIsLoading) && skeletons.map((skeleton, index) => {
                                return <Fragment key={index}>
                                    {skeleton}
                                </Fragment>
                            })
                        }
                        {
                            !weeklyDaysIsLoading && !userTimesIsLoading && !weeklyDaysIsError && !userTimesIsError && weeklyDays.map((item) => {
                                return (
                                    <WeeklyDayMemo
                                        key={`${item.id}_${item.initIntervals.length}`}
                                        weekDay={item}
                                        onCheckDay={onCheckDay}
                                        onChangeIntervals={onChangeIntervals}
                                    />
                                )
                            })
                        }
                        {
                            (!weeklyDaysIsLoading && weeklyDaysIsError) || (!userTimesIsLoading && userTimesIsError) &&
                            <div className="p-4">
                                <FeedbackMessage status="ERROR" message="Something went wrong! Can not get the hours settings" />
                            </div>
                        }
                    </div>
                    <div className="flex items-center justify-end">
                        <BuuddyButton
                            disabled={intervalsToSave.length === 0}
                            onClick={onSaveAvailableHours}
                            className="w-fit"
                            isPending={updateUserTimeIsPending}
                        >Save</BuuddyButton>
                    </div>
                </Fragment> :
                    <Fragment>
                        <FeedbackMessage status="INFORMATION" message="Add some roles before planning and adding available times for work" />

                    </Fragment>
            }

        </Card>
    )
}

export default AvailableHours;