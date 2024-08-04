import { type Session } from "next-auth";
import { Card } from "../ui/card";
import RoleList from "./RoleList";
import AvailableHours from "./AvailableHours";
import Profile from "./Profile";

type YourBuuddyContainerProps = {
  session: Session;
};

const YourBuuddyContainer = ({ session }: YourBuuddyContainerProps) => {
  return (
    <div className=" flex h-full w-full flex-col gap-2 p-4">
      <Profile session={session} />
      <div className="flex h-full w-full overflow-hidden">
        <Card className="flex min-w-96 flex-col gap-2">
          <span className="text-mochaText font-bold">Roles</span>
          <RoleList />
        </Card>
        <Card className="flex flex-col gap-2">
          <span className="text-mochaText font-bold">
            Planning and availability
          </span>
          <AvailableHours session={session} />
        </Card>
        <Card className="flex w-full flex-col gap-2">
          <span className="text-mochaText font-bold">Booking requests</span>
          <Card className="h-full w-full overflow-auto"></Card>
        </Card>
      </div>
    </div>
  );
};

export default YourBuuddyContainer;
