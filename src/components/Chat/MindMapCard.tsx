import { MapIcon } from "@heroicons/react/24/outline";
import { useTranslations } from "next-intl";
import type { MindMap } from "~/app/agents/chat/mind-map";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";
import { Button } from "../common/Button";
import { Card } from "../ui/card";

export const MindMapCard = ({ mindMap }: { mindMap: MindMap }) => {
	const t = useTranslations("MindMap");
	const { setDisplayFormEditor, setMindMapData, setDisplayMindMap } =
		useWorkspaceStore();

	const onOpen = () => {
		setDisplayFormEditor(false);
		setMindMapData(mindMap);
		setDisplayMindMap(true);
	};

	return (
		<Card className="flex items-center gap-3 border border-border bg-muted">
			<MapIcon className="h-8 w-8 min-w-8 text-primary" />
			<div className="min-w-0 flex-1">
				<p className="truncate font-medium text-foreground">{mindMap.title}</p>
				<p className="text-xs text-muted-foreground">
					{t("nodes", { count: mindMap.nodes.length })}
				</p>
			</div>
			<Button variant="outline" size="sm" onClick={onOpen}>
				{t("open")}
			</Button>
		</Card>
	);
};
