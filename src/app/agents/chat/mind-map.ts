import { tool } from "ai";
import { z } from "zod";

export const MIND_MAP_MAX_NODES = 60;

const mindMapNodeSchema = z.object({
	id: z
		.string()
		.min(1)
		.max(40)
		.describe("Unique id of the node, such as n1 or photosynthesis"),
	label: z.string().trim().min(1).max(80).describe("Text shown on the node"),
	parentId: z
		.string()
		.min(1)
		.max(40)
		.optional()
		.describe("Id of the parent node. Omit it for the single root node."),
});

export const mindMapInputSchema = z
	.object({
		title: z.string().trim().min(1).max(200).describe("Title of the mind map"),
		nodes: z
			.array(mindMapNodeSchema)
			.min(1)
			.max(MIND_MAP_MAX_NODES)
			.describe(
				"Every node of the map as a flat list. Exactly one node has no parentId; every other node points to an existing parent.",
			),
	})
	.superRefine((mindMap, ctx) => {
		const ids = new Set<string>();
		for (const node of mindMap.nodes) {
			if (ids.has(node.id)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Duplicate node id "${node.id}"`,
					path: ["nodes"],
				});
			}
			ids.add(node.id);
		}

		const roots = mindMap.nodes.filter((node) => !node.parentId);
		if (roots.length !== 1) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `Expected exactly one root node without parentId, found ${roots.length}`,
				path: ["nodes"],
			});
		}

		const parents = new Map(
			mindMap.nodes.map((node) => [node.id, node.parentId]),
		);
		for (const node of mindMap.nodes) {
			if (node.parentId && !parents.has(node.parentId)) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: `Node "${node.id}" references unknown parent "${node.parentId}"`,
					path: ["nodes"],
				});
			}

			// Walk up the parent chain; reaching the start again means a cycle.
			const seen = new Set<string>([node.id]);
			let current = node.parentId;
			while (current && parents.has(current)) {
				if (seen.has(current)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: `Node "${node.id}" is part of a parent cycle`,
						path: ["nodes"],
					});
					break;
				}
				seen.add(current);
				current = parents.get(current);
			}
		}
	});

export type MindMap = z.infer<typeof mindMapInputSchema>;

export const createMindMapTool = tool({
	description:
		"Create a mind map that shows a topic and its related ideas as a tree, displayed in the workspace side panel. Use it when the teacher asks for a mind map or concept map. Keep labels short and use a single root node for the main topic.",
	inputSchema: mindMapInputSchema,
	execute: async (mindMap) => ({ mindMap }),
});

export type CreateMindMapTool = typeof createMindMapTool;
