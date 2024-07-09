import { Skeleton } from "~/components/ui/skeleton"

const UserCardSkeleton = () => {
    return (
        <div className="p-4 rounded-md flex flex-col gap-3 min-w-52 max-w-52 min-h-52">
            <div className="flex items-center justify-center">
                <Skeleton className="min-w-16 max-w-16 h-16 rounded-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-16" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
    )
}

export default UserCardSkeleton;