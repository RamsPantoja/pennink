import { Card } from "~/components/ui/card";
import BuuddyCardOverview from "./BuuddyCardOverview";
import useBuuddyOverviewLogic from "./useBuuddyOverviewLogic";
import { Skeleton } from "~/components/ui/skeleton";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import BuudyCardOverviewSkeleton from "./BuuddyCardOverview/BuuddyCardOverviewSkeleton";
import Roles from "./Roles";
import TimesSelector from "./TimesSelector";
import ReviewList from "./ReviewList";

const BuuddyOverview = () => {
  const { buuddyProfileIsError, buuddyProfileIsLoading, buuddyProfileData } =
    useBuuddyOverviewLogic();

  console.log("about", buuddyProfileData?.profile.about);

  if (buuddyProfileIsLoading) {
    return (
      <Card className="flex w-full flex-col gap-4">
        <BuudyCardOverviewSkeleton />
        <div className="w-full space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="w-full space-y-2">
          <Skeleton className="h-5 w-60" />
          <Skeleton className="h-5 w-full" />
        </div>
        <div className="w-full space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="w-full space-y-2">
          <Skeleton className="h-5 w-60" />
          <Skeleton className="h-5 w-full" />
        </div>
      </Card>
    );
  }

  if (buuddyProfileIsError || !buuddyProfileData) {
    return (
      <FeedbackMessage
        status="ERROR"
        message="Fail to get the buuddy profile or page does not exist"
      />
    );
  }

  return (
    <Card className="flex w-full flex-col gap-2">
      <BuuddyCardOverview buuddyData={buuddyProfileData} />
      <Card className="flex h-full w-full gap-2 overflow-hidden">
        <div className="flex w-full max-w-screen-lg flex-col">
          <Card>
            <span className="font-bold text-blackMain">About</span>
            <p className="text-sm text-grayMain">
              {buuddyProfileData?.profile.about}
            </p>
          </Card>
          {buuddyProfileData?.profile.experience && (
            <Card>
              <span className="font-bold text-blackMain">Experience</span>
              <p className="text-sm text-grayMain">
                {buuddyProfileData?.profile.experience}
              </p>
            </Card>
          )}
          <Card className="flex flex-col gap-2">
            <span className="font-bold text-blackMain">Roles</span>
            <Roles userId={buuddyProfileData?.user?.id} />
          </Card>
          <Card>
            <span className="font-bold text-blackMain">Reviews</span>
            <ReviewList />
          </Card>
        </div>
        <div className="flex w-full flex-col gap-2">
          <span className="font-bold text-blackMain">Booking</span>
          <TimesSelector userId={buuddyProfileData?.user?.id} />
        </div>
      </Card>
    </Card>
  );
};

export default BuuddyOverview;
