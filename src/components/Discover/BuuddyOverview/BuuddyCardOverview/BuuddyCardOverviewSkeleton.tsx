import { Card } from "~/components/ui/card"
import { Skeleton } from "~/components/ui/skeleton"

const BuudyCardOverviewSkeleton = () => {
    return <Card className="flex gap-2 flex-col w-full">
        <div className="flex items-center gap-2 w-full">
            <Skeleton className="min-w-16 h-16 rounded-full " />
            <div className="space-y-2 w-full">
                <Skeleton className="h-10 w-full max-w-96" />
                <Skeleton className="h-4 w-60" />
            </div>
        </div>
        <div className="space-y-2">
            <Skeleton className="h-5 w-full max-w-96" />
            <Skeleton className="h-4 w-40" />
        </div>
    </Card>
};

export default BuudyCardOverviewSkeleton;