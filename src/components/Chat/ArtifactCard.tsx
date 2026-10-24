import { ArrowDownTrayIcon, DocumentIcon } from "@heroicons/react/24/outline";
import { Card } from "../ui/card";
import { buttonVariants } from "../common/Button";
import { cn } from "~/lib/utils";
import { useTranslations } from "next-intl";

export type ChatArtifact = {
	id: string;
	filename: string;
	type: string;
	size: number;
	downloadUrl: string;
};

const formatSize = (size: number) => {
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
	return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const ArtifactCard = ({ artifact }: { artifact: ChatArtifact }) => {
	const t = useTranslations("ArtifactCard");
	return (
		<Card className="flex items-center gap-3 border border-border bg-muted">
			<DocumentIcon className="h-8 w-8 min-w-8 text-primary" />
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium text-foreground">
					{artifact.filename}
				</p>
				<p className="text-xs text-muted-foreground">
					{artifact.type.split(";")[0]} · {formatSize(artifact.size)}
				</p>
			</div>
			<a
				href={artifact.downloadUrl}
				download
				className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
			>
				<ArrowDownTrayIcon className="mr-2 h-4 w-4" />
				{t("download")}
			</a>
		</Card>
	);
};
