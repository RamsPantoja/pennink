import { Calendar } from "~/components/ui/calendar";
import { Card } from "~/components/ui/card";
import useTimesSelectorLogic from "./useTimesSelectorLogic";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { Skeleton } from "~/components/ui/skeleton";
import TimeList from "./TimeList";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { Fragment } from "react";

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
		handleSelectRoleTimes,
		roleTimes,
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
					<div className="flex gap-2 w-full h-full flex-col 2xl:flex-row overflow-hidden">
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
						{Boolean(date) && (
							<div className="flex h-full w-full flex-col overflow-hidden p-1 gap-4">
								<span className="text-sm font-bold text-mochaSubText">
									Times
								</span>
								{timesToDisplay.length > 0 && (
									<Fragment key={date?.toLocaleString()}>
										<Select
											onValueChange={handleSelectRoleTimes}
											defaultValue={timesToDisplay[0]?.id}
										>
											<SelectTrigger className="w-[180px]">
												<SelectValue placeholder="Select a role" />
											</SelectTrigger>
											<SelectContent>
												{timesToDisplay?.map((item) => {
													return (
														<SelectItem key={item.id} value={item.id}>
															{item.userRole.role.name}
														</SelectItem>
													);
												})}
											</SelectContent>
										</Select>
										{roleTimes && (
											<TimeList roleTimes={roleTimes} selectedDate={date} />
										)}
									</Fragment>
								)}
							</div>
						)}
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
