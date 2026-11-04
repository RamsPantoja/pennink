import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";
import { Button } from "../common/Button";
import { Card } from "../ui/card";

export type PlanArtifactOutput = {
	status: "success" | "error";
	id?: string;
	title?: string;
	range?: "day" | "week" | "lesson";
	startDate?: string;
	endDate?: string;
	itemCount?: number;
};

export const PlanArtifactCard = ({ plan }: { plan: PlanArtifactOutput }) => {
	const t = useTranslations("PlanArtifact");
	const {
		setDisplayFormEditor,
		setDisplayMindMap,
		setDisplayLessonPlan,
		setLessonPlanId,
	} = useWorkspaceStore();

	if (!plan.id) return null;

	const onOpen = () => {
		setDisplayFormEditor(false);
		setDisplayMindMap(false);
		setLessonPlanId(plan.id ?? null);
		setDisplayLessonPlan(true);
	};

	return (
		<Card className="flex items-center gap-3 border border-border bg-muted">
			<DocumentTextIcon className="h-8 w-8 min-w-8 text-primary" />
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium text-foreground">{plan.title}</p>
				<p className="text-xs text-muted-foreground">
					{plan.range !== "week"
						? plan.startDate
						: t("dates", {
								start: plan.startDate ?? "",
								end: plan.endDate ?? "",
							})}
				</p>
			</div>
			<Button variant="outline" size="sm" onClick={onOpen}>
				{t("openPlan")}
			</Button>
		</Card>
	);
};
