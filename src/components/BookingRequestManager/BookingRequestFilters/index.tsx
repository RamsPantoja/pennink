import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import type { BookingRequestStatus } from "~/lib/enum";
import { bookingRequestStatusEnum } from "~/server/db/schema";

export type BookingRequestFilters = {
	bookingRequestType: BookingRequestType;
	status: BookingRequestStatus;
};

type BookingRequestFiltersProps = {
	filters: BookingRequestFilters;
	onChangeFilters: (filters: BookingRequestFilters) => void;
};

export type BookingRequestType = "SENT" | "INBOX";

const BookingRequestFilters = ({
	filters,
	onChangeFilters,
}: BookingRequestFiltersProps) => {
	const onChangeStatus = (status: BookingRequestStatus) => {
		onChangeFilters({
			...filters,
			status,
		});
	};

	return (
		<div className="flex items-center gap-2">
			<Select
				onValueChange={(value) => onChangeStatus(value as BookingRequestStatus)}
				defaultValue={filters.status}
			>
				<SelectTrigger className="w-[180px]">
					<SelectValue placeholder="Select a role" />
				</SelectTrigger>
				<SelectContent>
					{bookingRequestStatusEnum.enumValues.map((status) => (
						<SelectItem key={status} value={status}>
							{status}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
};

export default BookingRequestFilters;
