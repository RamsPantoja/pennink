import { useMemo, useState } from "react";
import { api } from "~/utils/api";

type UseTimesSelectorLogicProps = {
    userId: string | undefined
}

const useTimesSelectorLogic = ({ userId }: UseTimesSelectorLogicProps) => {
    const [date, setDate] = useState<Date | undefined>(new Date());

    const { data: userTimesData, isLoading: userTimesIsLoading, isError: userTimesIsError } = api.userTime.userTimes.useQuery({
        userId
    });

    const notAllowedWeeklyDays = useMemo(() => {
        const dayListNumber = [0, 1, 2, 3, 4, 5, 6];

        if (userTimesData) {
            const dayListNumber = [0, 1, 2, 3, 4, 5, 6];
            // Create a Set from the filter list for efficient lookups
            const filterSet = new Set(userTimesData.map((item) => { return item.weeklyDay.order }));

            // Filter the base list, removing numbers that are in the filter list
            return dayListNumber.filter(number => !filterSet.has(number));
        } else {
            return dayListNumber;
        }
    }, [userTimesData]);


    return {
        userTimesData,
        userTimesIsLoading,
        userTimesIsError,
        setDate,
        date,
        notAllowedWeeklyDays
    }
}

export default useTimesSelectorLogic;