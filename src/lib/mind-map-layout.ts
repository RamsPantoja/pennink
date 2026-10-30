export type MindMapLayoutNode = {
	id: string;
	parentId?: string;
};

export type MindMapPosition = {
	id: string;
	x: number;
	y: number;
};

export const MIND_MAP_COLUMN_WIDTH = 260;
export const MIND_MAP_ROW_HEIGHT = 80;

// Left-to-right tree layout: depth decides the column, leaves take consecutive
// rows and every parent is centred over its first and last child.
export const layoutMindMap = (
	nodes: MindMapLayoutNode[],
): MindMapPosition[] => {
	const children = new Map<string, string[]>();
	for (const node of nodes) {
		if (!node.parentId) continue;
		children.set(node.parentId, [
			...(children.get(node.parentId) ?? []),
			node.id,
		]);
	}

	const root = nodes.find((node) => !node.parentId);
	if (!root) return [];

	const positions: MindMapPosition[] = [];
	let nextRow = 0;

	const place = (id: string, depth: number): number => {
		const childIds = children.get(id) ?? [];
		const rows = childIds.length
			? childIds.map((childId) => place(childId, depth + 1))
			: [nextRow++];
		const y = ((rows[0] ?? 0) + (rows[rows.length - 1] ?? 0)) / 2;

		positions.push({
			id,
			x: depth * MIND_MAP_COLUMN_WIDTH,
			y: y * MIND_MAP_ROW_HEIGHT,
		});
		return y;
	};

	place(root.id, 0);
	return positions;
};
