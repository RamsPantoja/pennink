import { Calendar } from "~/components/ui/calendar";
import { Card } from "~/components/ui/card";
import useTimesSelectorLogic from "./useTimesSelectorLogic";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { Skeleton } from "~/components/ui/skeleton";
import TimeList from "./TimeList";

type TimesSelectorProps = {
	buuddyId: string | undefined;
};

const TimesSelector = ({ buuddyId }: TimesSelectorProps) => {
	const {
		userTimesData,
		userTimesIsLoading,
		userTimesIsError,
		setDate,
		date,
		notAllowedWeeklyDays,
		timesToDisplay,
	} = useTimesSelectorLogic({ buuddyId });

	return (
		<Card className="flex h-full w-full flex-col overflow-hidden">
			<span className="text-sm font-bold text-mochaSubText">Select a Date</span>
			{userTimesIsLoading && (
				<div className="flex w-full flex-col gap-2">
					<Skeleton className="h-80 min-w-16 max-w-96" />
					<div className="w-full space-y-2">
						<Skeleton className="h-10 w-full max-w-96" />
						<Skeleton className="h-4 w-60" />
					</div>
					<div className="w-full space-y-2">
						<Skeleton className="h-10 w-full max-w-96" />
						<Skeleton className="h-4 w-60" />
					</div>
					<div className="w-full space-y-2">
						<Skeleton className="h-10 w-full max-w-96" />
						<Skeleton className="h-4 w-60" />
					</div>
					<div className="w-full space-y-2">
						<Skeleton className="h-10 w-full max-w-96" />
						<Skeleton className="h-4 w-60" />
					</div>
				</div>
			)}
			{!userTimesIsLoading &&
				!userTimesIsError &&
				userTimesData &&
				userTimesData.length > 0 && (
					<div className="flex gap-2 w-full h-full flex-col md:flex-row overflow-hidden">
						<Calendar
							mode="single"
							selected={date}
							onSelect={setDate}
							disabled={[
								{ before: new Date() },
								{ dayOfWeek: notAllowedWeeklyDays },
							]}
							className="flex w-fit h-fit"
						/>
						<div className="flex h-full w-full flex-col overflow-hidden">
							<span className="text-sm font-bold text-mochaSubText">Times</span>
							<div className="flex flex-col gap-4 overflow-auto w-full h-fit">
								{timesToDisplay.length > 0 &&
									timesToDisplay.map((time) => {
										return (
											<TimeList key={time.id} time={time} selectedDate={date} />
										);
									})}
								{timesToDisplay.length === 0 && (
									<FeedbackMessage
										status="INFORMATION"
										message="No times to display"
									/>
								)}
							</div>
						</div>
					</div>
				)}
			{!userTimesIsLoading &&
				!userTimesIsError &&
				userTimesData?.length === 0 && (
					<div className="p-4">
						<FeedbackMessage
							status="INFORMATION"
							message="The buuddy has not configured its times"
						/>
					</div>
				)}
			{!userTimesIsLoading && userTimesIsError && (
				<div className="p-4">
					<FeedbackMessage
						status="ERROR"
						message="Something went wrong! Can not get the roles"
					/>
				</div>
			)}
		</Card>
	);
};

export default TimesSelector;
