import { type Session } from "next-auth";
import RoleList from "./RoleList";
import AvailableHours from "./AvailableHours";
import Profile from "./Profile";
import BookingRequestBuuddyList from "./BookingRequests/BookingRequestBuuddyList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import ConnectPayment from "./ConnectPayment";

type YourBuuddyContainerProps = {
  session: Session;
};

const YourBuuddyContainer = ({ session }: YourBuuddyContainerProps) => {
  return (
    <div className="flex h-full w-full flex-col p-4">
      <Profile session={session} />
      <div className="flex h-full w-full overflow-hidden">
        <Tabs
          defaultValue="roles_availability"
          className="flex h-full w-full flex-col items-start overflow-hidden"
        >
          <TabsList>
            <TabsTrigger value="roles_availability">
              Roles and availability
            </TabsTrigger>
            <TabsTrigger value="booking">Booking</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
          </TabsList>
          <TabsContent asChild value="roles_availability">
            <div className="flex h-full w-full overflow-hidden">
              <RoleList />
              <AvailableHours session={session} />
            </div>
          </TabsContent>
          <TabsContent asChild value="booking">
            <div className="flex h-full w-full flex-1 overflow-hidden">
              <div className="flex w-full flex-[0.4]">
                <BookingRequestBuuddyList receiverId={session.user.id} />
              </div>
              <div className="flex flex-[0.6]"></div>
            </div>
          </TabsContent>
          <TabsContent asChild value="payment">
            <ConnectPayment />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default YourBuuddyContainer;
