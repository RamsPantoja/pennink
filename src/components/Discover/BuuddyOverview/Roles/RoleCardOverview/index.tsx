import { Card } from "~/components/ui/card";
import RoleDetails from "~/components/YourBuuddy/RoleList/RoleCard/RoleDetails";
import { type UserRoleDetail } from "~/server/api/services/userRole";

type RoleCardOverviewProps = {
  role: string;
  description: string;
  hourPrice: string;
  details: UserRoleDetail[];
};

const RoleCardOverview = ({
  role,
  description,
  hourPrice,
  details,
}: RoleCardOverviewProps) => {
  return (
    <Card className="bg-mochaMantle flex w-full max-w-72 flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-mochaText font-bold">{role}</span>
      </div>
      <p className="text-mochaSubText text-sm">{description}</p>
      <div className="flex items-end gap-2">
        <span className="text-mochaText font-bold">${hourPrice} USD</span>
        <span className="text-sm">hour</span>
      </div>
      <div className="flex justify-end">
        <RoleDetails details={details} />
      </div>
    </Card>
  );
};

export default RoleCardOverview;
