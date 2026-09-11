import { SkillGraphNode } from '../../types/roadmap';
import { VisualizerNode, VisualizerEdge, LayoutConfig, LayoutBounds } from './types';

const DEFAULT_CONFIG: LayoutConfig = {
  nodeWidth: 220,
  nodeHeight: 90,
  horizontalSpacing: 90,
  verticalSpacing: 35,
  direction: 'LR', // Left-to-Right layout flow
};

export class LayoutEngine {
  /**
   * Compute deterministic DAG layout for a set of skill graph nodes
   */
  public static computeLayout(
    graphNodes: SkillGraphNode[],
    config: Partial<LayoutConfig> = {}
  ): { nodes: VisualizerNode[]; edges: VisualizerEdge[]; bounds: LayoutBounds } {
    const opts = { ...DEFAULT_CONFIG, ...config };
    if (!graphNodes || graphNodes.length === 0) {
      return {
        nodes: [],
        edges: [],
        bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 },
      };
    }

    const nodeMap = new Map<string, SkillGraphNode>();
    graphNodes.forEach((n) => nodeMap.set(n.skill.id, n));

    // 1. Calculate topological depth layer for each node (longest path from root)
    const layerMap = new Map<string, number>();

    const getLayer = (skillId: string, visited = new Set<string>()): number => {
      if (layerMap.has(skillId)) return layerMap.get(skillId)!;
      if (visited.has(skillId)) return 0; // Avoid circular loops if any

      visited.add(skillId);
      const node = nodeMap.get(skillId);
      if (!node || !node.prerequisiteSkillIds || node.prerequisiteSkillIds.length === 0) {
        layerMap.set(skillId, 0);
        return 0;
      }

      let maxPrereqLayer = -1;
      for (const prereqId of node.prerequisiteSkillIds) {
        if (nodeMap.has(prereqId)) {
          const l = getLayer(prereqId, new Set(visited));
          if (l > maxPrereqLayer) maxPrereqLayer = l;
        }
      }

      const layer = maxPrereqLayer + 1;
      layerMap.set(skillId, layer);
      return layer;
    };

    graphNodes.forEach((n) => getLayer(n.skill.id));

    // 2. Group nodes by layer
    const layers = new Map<number, SkillGraphNode[]>();
    graphNodes.forEach((n) => {
      const l = layerMap.get(n.skill.id) || 0;
      if (!layers.has(l)) layers.set(l, []);
      layers.get(l)!.push(n);
    });

    // Sort layers numerically
    const sortedLayerKeys = Array.from(layers.keys()).sort((a, b) => a - b);
    const maxNodesInLayer = Math.max(
      ...Array.from(layers.values()).map((list) => list.length),
      1
    );

    // 3. Compute Positions
    const nodes: VisualizerNode[] = [];
    const positions = new Map<string, { x: number; y: number }>();

    sortedLayerKeys.forEach((layerIndex) => {
      const nodesInLayer = layers.get(layerIndex)!;
      const totalLayerHeight =
        nodesInLayer.length * opts.nodeHeight +
        (nodesInLayer.length - 1) * opts.verticalSpacing;
      const maxLayerHeight =
        maxNodesInLayer * opts.nodeHeight +
        (maxNodesInLayer - 1) * opts.verticalSpacing;
      const startYOffset = (maxLayerHeight - totalLayerHeight) / 2;

      nodesInLayer.forEach((node, idx) => {
        let x = 0;
        let y = 0;

        if (opts.direction === 'LR') {
          x = layerIndex * (opts.nodeWidth + opts.horizontalSpacing) + 60;
          y = startYOffset + idx * (opts.nodeHeight + opts.verticalSpacing) + 60;
        } else {
          x = startYOffset + idx * (opts.nodeWidth + opts.horizontalSpacing) + 60;
          y = layerIndex * (opts.nodeHeight + opts.verticalSpacing) + 60;
        }

        positions.set(node.skill.id, { x, y });

        nodes.push({
          id: node.skill.id,
          skillId: node.skill.id,
          slug: node.skill.slug,
          name: node.skill.name,
          category: node.skill.category || 'Core',
          difficulty: node.skill.difficulty,
          status: node.status || 'available',
          verificationScore: node.userSkillRecord?.verificationScore,
          attemptCount: node.userSkillRecord?.attemptCount || 0,
          lastAttemptAt: node.userSkillRecord?.lastAttemptAt || null,
          prerequisites: node.prerequisiteSkillIds || [],
          dependents: node.dependentSkillIds || [],
          x,
          y,
          width: opts.nodeWidth,
          height: opts.nodeHeight,
          layer: layerIndex,
        });
      });
    });

    // 4. Compute Edges and Bezier curves
    const edges: VisualizerEdge[] = [];

    graphNodes.forEach((node) => {
      const targetPos = positions.get(node.skill.id);
      if (!targetPos) return;

      (node.prerequisiteSkillIds || []).forEach((prereqId) => {
        const sourcePos = positions.get(prereqId);
        if (!sourcePos) return;

        // Source port is right-middle; Target port is left-middle (for LR)
        let sx = sourcePos.x + opts.nodeWidth;
        let sy = sourcePos.y + opts.nodeHeight / 2;
        let tx = targetPos.x;
        let ty = targetPos.y + opts.nodeHeight / 2;

        if (opts.direction === 'TB') {
          sx = sourcePos.x + opts.nodeWidth / 2;
          sy = sourcePos.y + opts.nodeHeight;
          tx = targetPos.x + opts.nodeWidth / 2;
          ty = targetPos.y;
        }

        const deltaX = Math.abs(tx - sx) * 0.5;
        let pathData = '';

        if (opts.direction === 'LR') {
          const cx1 = sx + deltaX;
          const cy1 = sy;
          const cx2 = tx - deltaX;
          const cy2 = ty;
          pathData = `M ${sx},${sy} C ${cx1},${cy1} ${cx2},${cy2} ${tx},${ty}`;
        } else {
          const deltaY = Math.abs(ty - sy) * 0.5;
          const cx1 = sx;
          const cy1 = sy + deltaY;
          const cx2 = tx;
          const cy2 = ty - deltaY;
          pathData = `M ${sx},${sy} C ${cx1},${cy1} ${cx2},${cy2} ${tx},${ty}`;
        }

        edges.push({
          id: `edge-${prereqId}->${node.skill.id}`,
          sourceId: prereqId,
          targetId: node.skill.id,
          sourcePos: { x: sx, y: sy },
          targetPos: { x: tx, y: ty },
          pathData,
        });
      });
    });

    // 5. Compute Bounding Box
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((n) => {
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x + n.width > maxX) maxX = n.x + n.width;
      if (n.y + n.height > maxY) maxY = n.y + n.height;
    });

    if (nodes.length === 0) {
      minX = minY = maxX = maxY = 0;
    }

    const bounds: LayoutBounds = {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX + 120,
      height: maxY - minY + 120,
    };

    return { nodes, edges, bounds };
  }
}
