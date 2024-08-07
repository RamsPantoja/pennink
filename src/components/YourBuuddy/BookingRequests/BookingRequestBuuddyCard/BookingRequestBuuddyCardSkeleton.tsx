import { Card } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

const BookingRequestBuuddyCardSkeleton = () => {
  return (
    <Card className="flex flex-col gap-4">
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-40" />
      </div>
    </Card>
  );
};

export default BookingRequestBuuddyCardSkeleton;
