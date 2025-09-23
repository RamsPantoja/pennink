import { DocumentCheckIcon } from "@heroicons/react/24/outline";
import { DateTime } from "luxon";
import { useMemo } from "react";
import { Button } from "~/components/common/Button";
import ClipBoard from "~/components/common/Clipboard";
import { Badge } from "~/components/ui/badge";
import { Card } from "~/components/ui/card";
import { env } from "~/env";
import type { FormType } from "~/lib/enum";
import { useFormLoaderStore } from "./useFormLoaderStore";

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
	const { setCurrentLink, setBreadcrumbs, breadcrumbs } = useFormLoaderStore();
	const clipboardContent = useMemo(() => {
		if (type === "BASIC") return `${env.NEXT_PUBLIC_BASE_URL}/form/link/${id}`;
		if (type === "EXAM") return `${env.NEXT_PUBLIC_BASE_URL}/exam/link/${id}`;
		return `${env.NEXT_PUBLIC_BASE_URL}/`;
	}, [id, type]);

	return (
		<Card
			onClick={() => {
				setCurrentLink({ id, key: customKey, link: clipboardContent });
				setBreadcrumbs({ ...breadcrumbs, results: "Results" });
			}}
			className="flex gap-2 flex-col bg-mocha-mantle hover:bg-mocha-mantle/50 transition-colors h-fit"
		>
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
		</Card>
	);
};
