import type { RouterOutputs } from "~/utils/api";
import TimeCard from "../TimeCard";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import useTimeListLogic from "./useTimeListLogic";
import BookingRequestForm from "../BookingRequestForm";
import { useSession } from "next-auth/react";
import CustomAlertDialog from "~/components/common/AlertDialog";
import { useRouter } from "next/router";
import { Fragment } from "react";

type TimeListProps = {
	roleTimes: RouterOutputs["userTime"]["userTimes"][number];
	selectedDate: Date | undefined;
};

const TimeList = ({ roleTimes, selectedDate }: TimeListProps) => {
	const router = useRouter();
	const {
		times,
		displaySendBookingRequestForm,
		onDisplayBookingRequestForm,
		onCloseBookingRequestForm,
		selectedTime,
		displaySignInWarning,
		setDisplaySignInWarning,
	} = useTimeListLogic({ roleTimes, selectedDate });

	const { data: session, status } = useSession();

	return (
		<Fragment>
			{status !== "loading" && session && (
				<BookingRequestForm
					open={displaySendBookingRequestForm}
					onOpenChange={onCloseBookingRequestForm}
					time={selectedTime}
					date={selectedDate}
					buuddyId={roleTimes.userId}
					senderId={session.user.id}
					senderTimezoneIANA={Intl.DateTimeFormat().resolvedOptions().timeZone}
					buuddyTimezoneIANA={roleTimes.timezoneIANA}
					userRoleId={roleTimes.userRoleId}
				/>
			)}
			<CustomAlertDialog
				open={displaySignInWarning}
				title="Sign In Required"
				description="You need to sign in to book a time"
				cancelText="Close"
				actionText="Sign In"
				onAction={async () => {
					await router.push(`/sign_in?callback_url=${router.asPath}`);
				}}
				onCancel={() => setDisplaySignInWarning(false)}
				isPending={false}
			/>
			<div className="flex flex-col gap-2 overflow-auto p-2">
				{times.length === 0 && (
					<FeedbackMessage
						status="INFORMATION"
						message="No available times for this date"
					/>
				)}
				{times.length > 0 &&
					times.map((item) => {
						return (
							<TimeCard
								key={item}
								hour={item}
								onSendRequest={onDisplayBookingRequestForm}
							/>
						);
					})}
			</div>
		</Fragment>
	);
};

export default TimeList;
