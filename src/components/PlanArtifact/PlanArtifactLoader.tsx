"use client";

import { useTranslations } from "next-intl";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { PlanArtifactList } from "./PlanArtifactList";

type PlanArtifactLoaderProps = {
	workspaceId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

/**
 * The class plans section, opened as a dialog from the dashboard like the sources
 * and forms loaders. It is only offered while a workspace is open.
 */
export const PlanArtifactLoader = ({
	workspaceId,
	open,
	onOpenChange,
}: PlanArtifactLoaderProps) => {
	const t = useTranslations("PlanArtifact");

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="flex h-[85vh] w-full flex-col gap-4 overflow-hidden p-4 sm:max-w-6xl">
				<DialogHeader>
					<DialogTitle className="text-sm font-semibold">
						{t("title")}
					</DialogTitle>
					<DialogDescription>{t("dialogDescription")}</DialogDescription>
				</DialogHeader>
				<div className="min-h-0 flex-1">
					{open && <PlanArtifactList workspaceId={workspaceId} />}
				</div>
			</DialogContent>
		</Dialog>
	);
};
