"use client";

import {
	Background,
	Controls,
	type Edge,
	Handle,
	type Node,
	type NodeProps,
	Position,
	ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useMemo } from "react";
import { layoutMindMap } from "~/lib/mind-map-layout";
import { cn } from "~/lib/utils";
import { useWorkspaceStore } from "../Workspace/useWorkspaceStore";

type MindMapNodeData = {
	label: string;
	isRoot: boolean;
};

type MindMapFlowNode = Node<MindMapNodeData, "mindMap">;

const MindMapNode = ({ data }: NodeProps<MindMapFlowNode>) => (
	<div
		className={cn(
			"w-[200px] rounded-lg border px-3 py-2 text-center text-sm shadow-sm",
			data.isRoot
				? "border-primary bg-primary font-semibold text-primary-foreground"
				: "border-border bg-card text-foreground",
		)}
	>
		<Handle type="target" position={Position.Left} className="!bg-border" />
		{data.label}
		<Handle type="source" position={Position.Right} className="!bg-border" />
	</div>
);

const nodeTypes = { mindMap: MindMapNode };

export const MindMap = () => {
	const t = useTranslations("MindMap");
	const { resolvedTheme } = useTheme();
	const mindMap = useWorkspaceStore((state) => state.mindMapData);

	const { nodes, edges } = useMemo(() => {
		if (!mindMap) return { nodes: [], edges: [] };

		const positions = new Map(
			layoutMindMap(mindMap.nodes).map((position) => [position.id, position]),
		);

		const nodes: MindMapFlowNode[] = mindMap.nodes.map((node) => ({
			id: node.id,
			type: "mindMap",
			position: positions.get(node.id) ?? { x: 0, y: 0 },
			data: { label: node.label, isRoot: !node.parentId },
			draggable: false,
			selectable: false,
		}));

		const edges: Edge[] = mindMap.nodes.flatMap((node) =>
			node.parentId
				? [
						{
							id: `${node.parentId}-${node.id}`,
							source: node.parentId,
							target: node.id,
							type: "bezier",
						},
					]
				: [],
		);

		return { nodes, edges };
	}, [mindMap]);

	if (!mindMap) return null;

	return (
		<div className="flex h-full w-full flex-col">
			<div className="border-b border-border py-4 pl-6 pr-14">
				<h2 className="truncate text-lg font-semibold text-foreground">
					{mindMap.title}
				</h2>
			</div>
			<div className="min-h-0 flex-1" aria-label={t("canvasLabel")}>
				<ReactFlow
					nodes={nodes}
					edges={edges}
					nodeTypes={nodeTypes}
					colorMode={resolvedTheme === "dark" ? "dark" : "light"}
					fitView
					fitViewOptions={{ padding: 0.2 }}
					nodesDraggable={false}
					nodesConnectable={false}
					elementsSelectable={false}
				>
					<Background />
					<Controls showInteractive={false} />
				</ReactFlow>
			</div>
		</div>
	);
};
