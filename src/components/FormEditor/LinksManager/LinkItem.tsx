import { DateTime } from "luxon";
import { useMemo } from "react";
import ClipBoard from "~/components/common/Clipboard";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { env } from "~/env";

type LinkItemProps = {
	id: string;
	customKey: string;
	version: number;
	createdAt: Date;
};

export const LinkItem = ({
	id,
	customKey,
	version,
	createdAt,
}: LinkItemProps) => {
	const clipboardContent = useMemo(() => {
		return `${env.NEXT_PUBLIC_BASE_URL}/form/link/${id}`;
	}, [id]);

	return (
		<Card className="flex gap-1 flex-col bg-mocha-mantle">
			<div className="flex gap-4 justify-between">
				<p className="text-sm font-semibold">{customKey}</p>
				<Badge variant="outline">v{version}</Badge>
			</div>
			<div className="flex items-center">
				<p
					className="text-xs text-mocha-sub-text truncate ml-2"
					title={clipboardContent}
				>
					{clipboardContent}
				</p>
				<ClipBoard className="rounded-[4px]" content={clipboardContent} />
			</div>
			<p className="text-xs">
				{DateTime.fromJSDate(createdAt).toLocaleString(DateTime.DATETIME_MED)}
			</p>
		</Card>
	);
};
