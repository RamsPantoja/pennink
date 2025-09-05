import { api } from "~/utils/api";
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Skeleton } from "./ui/skeleton";
import { Fragment, useEffect, useMemo } from "react";
import { DateTime } from "luxon";
import { toast } from "sonner";

export const UsageService = () => {
	const utils = api.useUtils();
	const {
		data: staticsData,
		isLoading: staticsIsLoading,
		isError: staticsIsError,
	} = api.user.statics.useQuery();

	const { mutate: resetStaticsMutation } = api.user.resetStatics.useMutation({
		onSuccess: async () => {
			await utils.user.statics.invalidate();
		},
		onError: (e) => {
			toast.error(e.message);
		},
	});

	useEffect(() => {
		if (staticsData?.id) {
			resetStaticsMutation();
		}
	}, [resetStaticsMutation, staticsData?.id]);

	const resetWorkspacesTime = useMemo(() => {
		if (staticsData) {
			const specificDate = DateTime.fromJSDate(staticsData.workspacesResetedAt);
			const nextDay = specificDate.plus({ days: 1 });

			return nextDay.toLocaleString(DateTime.DATETIME_SHORT);
		}

		return "No date";
	}, [staticsData]);

	return (
		<Card className="border w-full max-w-80 flex flex-col gap-4">
			<p className="text-sm">Usage</p>
			<div className="flex flex-col">
				<p className="text-xs text-mocha-subtext1">Resets at</p>
				<span className="text-xs font-semibold">{resetWorkspacesTime}</span>
			</div>
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
							<p className="text-xs">{staticsData.workspaces}/2</p>
						</div>
						<Progress value={(staticsData.workspaces / 2) * 100} />
					</div>
					<div className="flex flex-col gap-2">
						<div className="flex gap-4 items-center justify-between">
							<p className="text-xs ">Messages</p>
							<p className="text-xs">{staticsData.messages}/20</p>
						</div>
						<Progress value={(staticsData.messages / 20) * 100} />
					</div>
					<div className="flex flex-col gap-2">
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
