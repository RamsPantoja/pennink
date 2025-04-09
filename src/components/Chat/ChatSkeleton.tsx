import { Skeleton } from "../ui/skeleton";

export const ChatSkeleton = () => {
	return (
		<div className="flex flex-col gap-4 w-full min-h-full p-4 max-w-screen-md">
			{/* Left aligned message */}
			<div className="flex gap-3">
				<Skeleton className="w-10 h-10 rounded-full" /> {/* Avatar */}
				<div className="flex flex-col gap-2">
					<Skeleton className="w-32 h-4" /> {/* Name */}
					<Skeleton className="w-64 h-10 rounded-lg" /> {/* Message bubble */}
				</div>
			</div>

			{/* Right aligned message */}
			<div className="flex gap-3 flex-row-reverse">
				<Skeleton className="w-10 h-10 rounded-full" /> {/* Avatar */}
				<div className="flex flex-col gap-2 items-end">
					<Skeleton className="w-32 h-4" /> {/* Name */}
					<Skeleton className="w-48 h-10 rounded-lg" /> {/* Message bubble */}
				</div>
			</div>

			{/* Left aligned message */}
			<div className="flex gap-3">
				<Skeleton className="w-10 h-10 rounded-full" />
				<div className="flex flex-col gap-2">
					<Skeleton className="w-32 h-4" />
					<Skeleton className="w-72 h-10 rounded-lg" />
				</div>
			</div>

			{/* Right aligned message */}
			<div className="flex gap-3 flex-row-reverse">
				<Skeleton className="w-10 h-10 rounded-full" />
				<div className="flex flex-col gap-2 items-end">
					<Skeleton className="w-32 h-4" />
					<Skeleton className="w-56 h-10 rounded-lg" />
				</div>
			</div>
		</div>
	);
};
