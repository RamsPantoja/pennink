import { Card } from "~/components/ui/card";
import { Skeleton } from "~/components/ui/skeleton";

const BookingRequestBuuddyCardSkeleton = () => {
  return (
    <Card className="flex flex-col gap-4 max-w-sm min-w-[384px] justify-between">
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
};

export default BookingRequestBuuddyCardSkeleton;
