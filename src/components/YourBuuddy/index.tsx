import type { Session } from "next-auth";
import RoleList from "./RoleList";
import AvailableHours from "./AvailableHours";
import Profile from "./Profile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ConnectPayment from "./ConnectPayment";
import ProfileEditor from "./ProfileEditor";
import BookingRequestManager from "./BookingRequestManager";

type YourBuuddyContainerProps = {
	session: Session;
};

const YourBuuddyContainer = ({ session }: YourBuuddyContainerProps) => {
	return (
		<div className="flex h-full w-full flex-col pl-4 pr-4 pb-4">
			<Profile session={session} />
			<div className="flex h-full w-full overflow-hidden">
				<Tabs
					defaultValue="booking"
					className="flex h-full w-full flex-col items-start overflow-hidden"
				>
					<TabsList>
						<TabsTrigger value="booking">Booking</TabsTrigger>
						<TabsTrigger value="roles_availability">
							Roles and availability
						</TabsTrigger>
						<TabsTrigger value="profile">Profile</TabsTrigger>
						<TabsTrigger value="payment">Payment</TabsTrigger>
					</TabsList>
					<TabsContent asChild value="roles_availability">
						<div className="flex h-full w-full overflow-hidden">
							<RoleList />
							<AvailableHours session={session} />
						</div>
					</TabsContent>
					<TabsContent asChild value="booking">
						<BookingRequestManager session={session} />
					</TabsContent>
					<TabsContent asChild value="payment">
						<ConnectPayment />
					</TabsContent>
					<TabsContent asChild value="profile">
						<div className="flex h-full w-full overflow-hidden">
							<ProfileEditor />
						</div>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
};

export default YourBuuddyContainer;
