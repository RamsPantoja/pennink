import { api } from "~/utils/api";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Skeleton } from "./ui/skeleton";
import { Fragment } from "react";

export const UsageService = () => {
	const {
		data: staticsData,
		isLoading: staticsIsLoading,
		isError: staticsIsError,
	} = api.user.statics.useQuery();

	return (
		<Card className="border w-full max-w-80 flex flex-col gap-8">
			<p className="text-sm">Service usage</p>

			{staticsIsLoading && (
				<div className="flex flex-col gap-4">
					<Skeleton className="w-full h-5" />
					<div className="flex flex-col gap-2">
						<Skeleton className="w-full h-8 rounded-lg" />
						<Skeleton className="w-full h-2 rounded-lg" />
					</div>
					<div className="flex flex-col gap-2">
						<Skeleton className="w-full h-8 rounded-lg" />
						<Skeleton className="w-full h-2 rounded-lg" />
					</div>
				</div>
			)}
			{!staticsIsLoading && !staticsIsError && staticsData && (
				<Fragment>
					<div className="flex flex-col gap-2">
						<div className="flex gap-4 items-center justify-between">
							<p className="text-xs ">Workspaces</p>
							<p className="text-xs">{staticsData.workspaces}/25</p>
						</div>
						<Progress value={(staticsData.workspaces / 25) * 100} />
					</div>
					<div className="flex flex-col gap-2">
						<span className="text-xs text-right">
							Resets tomorrow at 6:00 PM
						</span>
						<div className="flex gap-4 items-center justify-between">
							<p className="text-xs ">Upload files</p>
							<p className="text-xs">{staticsData.files}/5</p>
						</div>
						<Progress value={(staticsData.files / 5) * 100} />
					</div>
				</Fragment>
			)}
		</Card>
	);
};
