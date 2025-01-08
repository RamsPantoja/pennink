import Link from "next/link";

import { BuuddyButton } from "~/components/common/BuuddyButton";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Card } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { convertTo12HourFormat } from "~/lib/utils";
import { api } from "~/utils/api";

type BookingRequestProps = {
	id: string;
};

export const BookingRequest = ({ id }: BookingRequestProps) => {
	const {
		data: bookingRequestData,
		isError: bookingRequestIsError,
		isLoading: bookingRequestIsLoading,
	} = api.bookingRequest.bookingRequestsById.useQuery({
		id,
	});

	if (bookingRequestIsLoading) {
		return (
			<Card className="flex flex-col gap-4 max-w-2xl w-full h-fit min-w-[384px] justify-between">
				<div className="flex gap-2">
					<Skeleton className="h-12 min-w-12 rounded-full" />
					<div className="flex gap-2 flex-col w-full">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-5 w-40" />
					</div>
				</div>
				<div className="space-y-2">
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
				<div className="flex gap-2 items-center justify-end">
					<Skeleton className="h-10 w-32" />
					<Skeleton className="h-10 w-32" />
				</div>
			</Card>
		);
	}

	if (bookingRequestIsError || !bookingRequestData) {
		return (
			<FeedbackMessage status="ERROR" message="Error loading booking request" />
		);
	}

	const { receiver, status, bookingDate, bookingTime, message, userRole } =
		bookingRequestData;

	return (
		<Card className="flex max-w-2xl w-full flex-col h-fit gap-2 p-4">
			<div className="flex justify-between gap-2">
				<div className="flex basis-full items-center gap-4 overflow-hidden">
					<Avatar className="h-12 min-w-12">
						<AvatarImage src={receiver.image} />
						<AvatarFallback>Tú</AvatarFallback>
					</Avatar>
					<div className="flex flex-1 flex-col overflow-hidden">
						<Link
							href={`/profile/${receiver.profile.username}`}
							className="max-w-fit truncate font-semibold text-mochaText hover:underline"
						>
							{receiver.name}
						</Link>
						<span className="truncate text-sm text-mochaSubText">
							{receiver.profile.headline}
						</span>
					</div>
				</div>
				<span className="text-sm text-mochaMauve">{status}</span>
			</div>
			<div className="flex flex-col gap-2 pb-2 pt-2">
				<div className="flex items-center justify-between">
					<span className="text-sm text-mochaSubText">Date</span>
					<span className="text-mochaText font-bold">
						{bookingDate.toLocaleDateString()}
					</span>
				</div>
				<Separator />
				<div className="flex items-center justify-between">
					<span className="text-sm text-mochaSubText">Time</span>
					<span className="text-mochaText font-bold">
						{convertTo12HourFormat(bookingTime)}
					</span>
				</div>
				<Separator />
				<div className="flex items-center justify-between">
					<span className="text-sm text-mochaSubText">Role</span>
					<span className="text-mochaText font-bold">{userRole.role.name}</span>
				</div>
				<Separator />
				<div className="flex items-center justify-between">
					<span className="text-sm text-mochaSubText">Price</span>
					<span className="text-mochaText font-bold">
						${userRole.hourPrice} USD
					</span>
				</div>
				<Separator />
				<div className="flex flex-col">
					<span className="text-sm text-mochaSubText">Message</span>
					<span className="text-mochaText font-bold">{message}</span>
				</div>
			</div>
			<div className="flex w-full flex-1 items-end justify-end">
				{status === "ACCEPTED" && (
					<BuuddyButton className="w-fit" onClick={() => console.log("PAY!")}>
						Go to pay
					</BuuddyButton>
				)}
			</div>
		</Card>
	);
};
