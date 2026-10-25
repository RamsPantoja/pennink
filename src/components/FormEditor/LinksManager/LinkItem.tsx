import { DateTime } from "luxon";
import { useMemo } from "react";
import ClipBoard from "~/components/common/Clipboard";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { env } from "~/env";
import type { FormType } from "~/lib/enum";

type LinkItemProps = {
	id: string;
	version: number;
	createdAt: Date;
	classroomName: string;
	type: FormType;
};

export const LinkItem = ({
	id,
	version,
	createdAt,
	classroomName,
	type,
}: LinkItemProps) => {
	const clipboardContent = useMemo(() => {
		if (type === "BASIC") return `${env.NEXT_PUBLIC_BASE_URL}/form/link/${id}`;
		if (type === "EXAM") return `${env.NEXT_PUBLIC_BASE_URL}/exam/link/${id}`;
	}, [id, type]);

	return (
		<Card className="flex gap-1 flex-col bg-muted">
			<div className="flex items-center">
				<p
					className="text-xs text-muted-foreground truncate"
					title={clipboardContent}
				>
					{clipboardContent}
				</p>
				{clipboardContent && (
					<ClipBoard className="rounded-[4px]" content={clipboardContent} />
				)}
			</div>
			<div className="flex gap-4 justify-between items-center">
				<p className="text-xs">
					{classroomName} ·{" "}
					{DateTime.fromJSDate(createdAt).toLocaleString(DateTime.DATETIME_MED)}
				</p>
				<Badge variant="outline">v{version}</Badge>
			</div>
		</Card>
	);
};
