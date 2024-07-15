import { Calendar } from "~/components/ui/calendar";
import { Card } from "~/components/ui/card";
import useTimesSelectorLogic from "./useTimesSelectorLogic";
import { Fragment } from "react";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { Skeleton } from "~/components/ui/skeleton";

type TimesSelectorProps = {
    userId: string | undefined
}

const TimesSelector = ({ userId }: TimesSelectorProps) => {
    const {
        userTimesData,
        userTimesIsLoading,
        userTimesIsError,
        setDate,
        date,
        notAllowedWeeklyDays
    } = useTimesSelectorLogic({ userId });


    return (
        <Card className="flex flex-col gap-2 border">
            <span className="text-blackMain text-sm font-bold">Select a Date and Time</span>
            {
                userTimesIsLoading && <div className="flex flex-col gap-2 w-full">
                    <Skeleton className="min-w-16 max-w-96 h-80" />
                    <div className="space-y-2 w-full">
                        <Skeleton className="h-10 w-full max-w-96" />
                        <Skeleton className="h-4 w-60" />
                    </div>
                    <div className="space-y-2 w-full">
                        <Skeleton className="h-10 w-full max-w-96" />
                        <Skeleton className="h-4 w-60" />
                    </div>
                    <div className="space-y-2 w-full">
                        <Skeleton className="h-10 w-full max-w-96" />
                        <Skeleton className="h-4 w-60" />
                    </div>
                    <div className="space-y-2 w-full">
                        <Skeleton className="h-10 w-full max-w-96" />
                        <Skeleton className="h-4 w-60" />
                    </div>
                </div>
            }
            {
                !userTimesIsLoading && !userTimesIsError && userTimesData && userTimesData.length > 0 && <div>
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={[{ before: new Date() }, { dayOfWeek: notAllowedWeeklyDays }]}
                    />
                    <div className="flex flex-col gap-2">

                    </div>
                </div>
            }
            {
                !userTimesIsLoading && !userTimesIsError && userTimesData?.length === 0 &&
                <div className="p-4">
                    <FeedbackMessage status="INFORMATION" message="The buuddy has not configured its times" />
                </div>
            }
            {
                !userTimesIsLoading &&
                userTimesIsError &&
                <div className="p-4">
                    <FeedbackMessage status="ERROR" message="Something went wrong! Can not get the roles" />
                </div>
            }

        </Card>
    )
}

export default TimesSelector;