import { useMemo, useState } from "react";
import { type RouterOutputs, api } from "~/utils/api";

type UseTimesSelectorLogicProps = {
	buuddyId: string | undefined;
};

const useTimesSelectorLogic = ({ buuddyId }: UseTimesSelectorLogicProps) => {
	const [date, setDate] = useState<Date | undefined>();
	const [roleTimes, setRoleTimes] = useState<
		RouterOutputs["userTime"]["userTimes"][number] | null | undefined
	>(null);

	const {
		data: userTimesData,
		isLoading: userTimesIsLoading,
		isError: userTimesIsError,
	} = api.userTime.userTimes.useQuery({
		userId: buuddyId,
	});

	const notAllowedWeeklyDays = useMemo(() => {
		const dayListNumber = [0, 1, 2, 3, 4, 5, 6];

		if (userTimesData) {
			const dayListNumber = [0, 1, 2, 3, 4, 5, 6];
			// Create a Set from the filter list for efficient lookups
			const filterSet = new Set(
				userTimesData.map((item) => {
					return item.weeklyDay.order;
				}),
			);

			// Filter the base list, removing numbers that are in the filter list
			return dayListNumber.filter((number) => !filterSet.has(number));
		}

		return dayListNumber;
	}, [userTimesData]);

	const timesToDisplay = useMemo(() => {
		if (userTimesData && date) {
			const allowedTimes = userTimesData.filter(
				(time) => time.weeklyDay.order === date.getUTCDay(),
			);
			setRoleTimes(allowedTimes[0]);

			return allowedTimes;
		}

		return [];
	}, [userTimesData, date]);

	const handleSelectRoleTimes = (id: string) => {
		const roleTimes = timesToDisplay.find((time) => time.id === id);
		setRoleTimes(roleTimes);
	};

	return {
		userTimesData,
		userTimesIsLoading,
		userTimesIsError,
		setDate,
		date,
		notAllowedWeeklyDays,
		timesToDisplay,
		handleSelectRoleTimes,
		roleTimes,
	};
};

export default useTimesSelectorLogic;
