import { DocumentCheckIcon } from "@heroicons/react/24/outline";
import { DateTime } from "luxon";
import { useMemo } from "react";
import { Button } from "~/components/common/Button";
import ClipBoard from "~/components/common/Clipboard";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { env } from "~/env";
import type { FormType } from "~/lib/enum";

type LinkItemProps = {
	id: string;
	customKey: string;
	version: number;
	createdAt: Date;
	type: FormType;
};

export const LinkItem = ({
	id,
	customKey,
	version,
	createdAt,
	type,
}: LinkItemProps) => {
	const clipboardContent = useMemo(() => {
		if (type === "BASIC") return `${env.NEXT_PUBLIC_BASE_URL}/form/link/${id}`;
		if (type === "EXAM") return `${env.NEXT_PUBLIC_BASE_URL}/exam/link/${id}`;
	}, [id, type]);

	const onResults = () => {
		console.log("onResults");
	};

	return (
		<Card className="flex gap-2 flex-col bg-mocha-mantle h-fit">
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
				{clipboardContent && (
					<ClipBoard className="rounded-[4px]" content={clipboardContent} />
				)}
			</div>
			<p className="text-xs">
				{DateTime.fromJSDate(createdAt).toLocaleString(DateTime.DATETIME_MED)}
			</p>
			<Button
				startIcon={<DocumentCheckIcon className="min-w-5 h-5" />}
				onClick={onResults}
				size="sm"
				className="w-fit"
			>
				Results
			</Button>
		</Card>
	);
};
