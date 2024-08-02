import { Card } from "~/components/ui/card";
import useRoleLogic from "./useRoleLogic";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import RoleCardOverview from "./RoleCardOverview";
import { Fragment } from "react";
import { mapSkeletons } from "~/lib/utils";
import RoleCardSkeleton from "~/components/YourBuuddy/RoleList/RoleCard/RoleCardSkeleton";

type RolesProps = {
  userId: string | undefined;
};

const Roles = ({ userId }: RolesProps) => {
  const {
    buuddyRolesData,
    buuddyRolesIsLoading,
    buuddyRolesIsError,
  } = useRoleLogic({ userId });

  const skeletons = mapSkeletons({
    numberOfSkeletons: 2,
    skeleton: <RoleCardSkeleton />,
  });

  return (
    <Card className="flex gap-2 flex-wrap p-0">
      {buuddyRolesIsLoading && skeletons.map((skeleton, index) => {
        return (
          <Fragment key={index}>
            {skeleton}
          </Fragment>
        );
      })}
      {!buuddyRolesIsLoading && !buuddyRolesIsError &&
        buuddyRolesData?.map((item) => {
          return (
            <RoleCardOverview
              key={item.id}
              role={item.role.name}
              hourPrice={item.hourPrice}
              description={item.description}
              details={item.userRoleDetails}
            />
          );
        })}
      {!buuddyRolesIsLoading && !buuddyRolesIsError &&
        buuddyRolesData?.length === 0 &&
        (
          <div className="p-4">
            <FeedbackMessage
              status="INFORMATION"
              message="The buuddy has not available roles"
            />
          </div>
        )}
      {!buuddyRolesIsLoading &&
        buuddyRolesIsError &&
        (
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

export default Roles;
