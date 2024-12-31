import type { RouterOutputs } from "~/utils/api";
import TimeCard from "../TimeCard";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import useTimeListLogic from "./useTimeListLogic";
import BookingRequestForm from "../BookingRequestForm";
import { useSession } from "next-auth/react";
import CustomAlertDialog from "~/components/common/AlertDialog";
import { useRouter } from "next/router";

type TimeListProps = {
	time: RouterOutputs["userTime"]["userTimes"][number];
	selectedDate: Date | undefined;
};

const TimeList = ({ time, selectedDate }: TimeListProps) => {
	const router = useRouter();
	const {
		times,
		displaySendBookingRequestForm,
		onDisplayBookingRequestForm,
		onCloseBookingRequestForm,
		selectedTime,
		displaySignInWarning,
		setDisplaySignInWarning,
	} = useTimeListLogic({ time, selectedDate });

	const { data: session, status } = useSession();

	return (
		<div className="flex flex-col gap-4 p-2">
			{status !== "loading" && session && (
				<BookingRequestForm
					open={displaySendBookingRequestForm}
					onOpenChange={onCloseBookingRequestForm}
					time={selectedTime}
					date={selectedDate}
					buuddyId={time.userId}
					senderId={session.user.id}
					senderTimezoneIANA={Intl.DateTimeFormat().resolvedOptions().timeZone}
					buuddyTimezoneIANA={time.timezoneIANA}
					userRoleId={time.userRoleId}
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
			<span className="text-sm font-bold text-mochaText">
				{time.userRole.role.name}
			</span>
			<div className="flex flex-col gap-2">
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
		</div>
	);
};

export default TimeList;
