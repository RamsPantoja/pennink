import { Card } from "~/components/ui/card";
import BuuddyCardOverview from "./BuuddyCardOverview";
import useBuuddyOverviewLogic from "./useBuuddyOverviewLogic";
import { Skeleton } from "~/components/ui/skeleton";
import FeedbackMessage from "~/components/common/FeedbackMessage";
import BuudyCardOverviewSkeleton from "./BuuddyCardOverview/BuuddyCardOverviewSkeleton";

const BuuddyOverview = () => {
    const {
        buuddyProfileIsError,
        buuddyProfileIsLoading,
        buuddyProfileData
    } = useBuuddyOverviewLogic();

    if (buuddyProfileIsLoading) {
        return (
            <Card className="flex gap-4 flex-col w-full">
                <BuudyCardOverviewSkeleton />
                <div className="space-y-2 w-full">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2 w-full">
                    <Skeleton className="h-5 w-60" />
                    <Skeleton className="h-5 w-full" />
                </div>
                <div className="space-y-2 w-full">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2 w-full">
                    <Skeleton className="h-5 w-60" />
                    <Skeleton className="h-5 w-full" />
                </div>
            </Card>
        )
    }

    if (buuddyProfileIsError || !buuddyProfileData) {
        return (
            <FeedbackMessage status="ERROR" message="Fail to get the buuddy profile or page does not exist" />
        )
    }

    return (
        <BuuddyCardOverview
            buuddyData={buuddyProfileData}
        />
    )
}

export default BuuddyOverview;