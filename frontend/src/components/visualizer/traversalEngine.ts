import {
  VisualizerNode,
  VisualizerEdge,
  TraversalHighlightState,
  UnlockSimulationResult,
  LearningPathResult,
  LearningStep,
} from './types';

export class DependencyTraversalEngine {
  /**
   * Traverse upstream in the DAG to find all direct and transitive prerequisites
   * for a target skill, identifying which prerequisites are already satisfied vs missing.
   */
  public static getUpstreamPrerequisites(
    targetSkillId: string,
    nodes: VisualizerNode[],
    edges: VisualizerEdge[]
  ): {
    prerequisiteNodeIds: Set<string>;
    missingPrerequisiteNodeIds: Set<string>;
    prerequisiteEdgeIds: Set<string>;
  } {
    const prerequisiteNodeIds = new Set<string>();
    const missingPrerequisiteNodeIds = new Set<string>();
    const prerequisiteEdgeIds = new Set<string>();

    const nodeMap = new Map<string, VisualizerNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    const queue: string[] = [targetSkillId];
    const visited = new Set<string>([targetSkillId]);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentNode = nodeMap.get(currentId);
      if (!currentNode) continue;

      for (const prereqId of currentNode.prerequisites || []) {
        if (!visited.has(prereqId)) {
          visited.add(prereqId);
          prerequisiteNodeIds.add(prereqId);
          queue.push(prereqId);

          const prereqNode = nodeMap.get(prereqId);
          if (prereqNode && prereqNode.status !== 'verified') {
            missingPrerequisiteNodeIds.add(prereqId);
          }
        }
      }
    }

    // Find all connecting edges between nodes in the upstream subgraph
    const allUpstreamNodes = new Set([...prerequisiteNodeIds, targetSkillId]);
    edges.forEach((edge) => {
      if (allUpstreamNodes.has(edge.sourceId) && allUpstreamNodes.has(edge.targetId)) {
        prerequisiteEdgeIds.add(edge.id);
      }
    });

    return {
      prerequisiteNodeIds,
      missingPrerequisiteNodeIds,
      prerequisiteEdgeIds,
    };
  }

  /**
   * Traverse downstream in the DAG to find all direct and transitive dependents
   * that rely on the given source skill.
   */
  public static getDownstreamDependents(
    sourceSkillId: string,
    nodes: VisualizerNode[],
    edges: VisualizerEdge[]
  ): {
    dependentNodeIds: Set<string>;
    dependentEdgeIds: Set<string>;
  } {
    const dependentNodeIds = new Set<string>();
    const dependentEdgeIds = new Set<string>();

    const nodeMap = new Map<string, VisualizerNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    const queue: string[] = [sourceSkillId];
    const visited = new Set<string>([sourceSkillId]);

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const currentNode = nodeMap.get(currentId);
      if (!currentNode) continue;

      for (const depId of currentNode.dependents || []) {
        if (!visited.has(depId)) {
          visited.add(depId);
          dependentNodeIds.add(depId);
          queue.push(depId);
        }
      }
    }

    // Find all connecting edges in the downstream subgraph
    const allDownstreamNodes = new Set([...dependentNodeIds, sourceSkillId]);
    edges.forEach((edge) => {
      if (allDownstreamNodes.has(edge.sourceId) && allDownstreamNodes.has(edge.targetId)) {
        dependentEdgeIds.add(edge.id);
      }
    });

    return {
      dependentNodeIds,
      dependentEdgeIds,
    };
  }

  /**
   * Compute comprehensive highlight state for the canvas when a skill node is selected.
   */
  public static getTraversalHighlightState(
    selectedNodeId: string | null,
    nodes: VisualizerNode[],
    edges: VisualizerEdge[]
  ): TraversalHighlightState {
    if (!selectedNodeId) {
      return {
        selectedNodeId: null,
        prerequisiteNodeIds: new Set(),
        missingPrerequisiteNodeIds: new Set(),
        prerequisiteEdgeIds: new Set(),
        dependentNodeIds: new Set(),
        dependentEdgeIds: new Set(),
        unlockedEdgeIds: new Set(),
      };
    }

    const upstream = this.getUpstreamPrerequisites(selectedNodeId, nodes, edges);
    const downstream = this.getDownstreamDependents(selectedNodeId, nodes, edges);

    // Identify unlock edges (edges originating from verified nodes to available/in-progress nodes)
    const unlockedEdgeIds = new Set<string>();
    const nodeMap = new Map<string, VisualizerNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    edges.forEach((edge) => {
      const source = nodeMap.get(edge.sourceId);
      const target = nodeMap.get(edge.targetId);
      if (
        source &&
        target &&
        source.status === 'verified' &&
        (target.status === 'available' || target.status === 'in_progress' || target.status === 'verified')
      ) {
        unlockedEdgeIds.add(edge.id);
      }
    });

    return {
      selectedNodeId,
      prerequisiteNodeIds: upstream.prerequisiteNodeIds,
      missingPrerequisiteNodeIds: upstream.missingPrerequisiteNodeIds,
      prerequisiteEdgeIds: upstream.prerequisiteEdgeIds,
      dependentNodeIds: downstream.dependentNodeIds,
      dependentEdgeIds: downstream.dependentEdgeIds,
      unlockedEdgeIds,
    };
  }

  /**
   * Simulate the state of the graph if one or more candidate skills were verified.
   * Deterministically returns which locked nodes would become unlocked/available.
   */
  public static simulateUnlock(
    candidateSkillIds: string[],
    nodes: VisualizerNode[]
  ): UnlockSimulationResult {
    const verifiedOrCandidateSet = new Set<string>(candidateSkillIds);

    // Add all currently verified skills to the set
    nodes.forEach((n) => {
      if (n.status === 'verified') {
        verifiedOrCandidateSet.add(n.id);
      }
    });

    const newlyUnlockedSkillIds: string[] = [];
    const alreadyAvailableOrVerifiedSkillIds: string[] = [];
    const stillLockedSkillIds: string[] = [];

    nodes.forEach((node) => {
      if (node.status === 'verified' || node.status === 'available' || node.status === 'in_progress') {
        alreadyAvailableOrVerifiedSkillIds.push(node.id);
        return;
      }

      // If node is currently locked, check if all prerequisites are now satisfied
      const allPrereqsSatisfied =
        !node.prerequisites ||
        node.prerequisites.length === 0 ||
        node.prerequisites.every((prereqId) => verifiedOrCandidateSet.has(prereqId));

      if (allPrereqsSatisfied) {
        newlyUnlockedSkillIds.push(node.id);
      } else {
        stillLockedSkillIds.push(node.id);
      }
    });

    return {
      simulatedSkillIds: candidateSkillIds,
      newlyUnlockedSkillIds,
      alreadyAvailableOrVerifiedSkillIds,
      stillLockedSkillIds,
    };
  }

  /**
   * Find the optimal curriculum/learning path to achieve a target goal skill,
   * sorted in topological dependency order from foundation to goal.
   */
  public static findLearningPathToGoal(
    goalSkillId: string,
    nodes: VisualizerNode[],
    edges: VisualizerEdge[]
  ): LearningPathResult {
    const nodeMap = new Map<string, VisualizerNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    const goalNode = nodeMap.get(goalSkillId);
    if (!goalNode) {
      return {
        targetSkillId: goalSkillId,
        targetSkillName: 'Unknown Skill',
        isAlreadyVerified: false,
        totalSteps: 0,
        missingStepsCount: 0,
        steps: [],
        edgeIdsInPath: [],
      };
    }

    const { prerequisiteNodeIds, prerequisiteEdgeIds } = this.getUpstreamPrerequisites(
      goalSkillId,
      nodes,
      edges
    );

    // All nodes in the path: prerequisites + goal
    const pathNodeIds = new Set([...prerequisiteNodeIds, goalSkillId]);
    const pathNodes = Array.from(pathNodeIds)
      .map((id) => nodeMap.get(id))
      .filter((n): n is VisualizerNode => Boolean(n));

    // Sort topologically by layer, then by name for stable deterministic ordering
    pathNodes.sort((a, b) => {
      if (a.layer !== b.layer) return a.layer - b.layer;
      return a.name.localeCompare(b.name);
    });

    const steps: LearningStep[] = pathNodes.map((n) => ({
      skillId: n.id,
      name: n.name,
      status: n.status,
      difficulty: n.difficulty,
      layer: n.layer,
      isMissing: n.status !== 'verified',
    }));

    const missingStepsCount = steps.filter((s) => s.isMissing).length;

    return {
      targetSkillId: goalNode.id,
      targetSkillName: goalNode.name,
      isAlreadyVerified: goalNode.status === 'verified',
      totalSteps: steps.length,
      missingStepsCount,
      steps,
      edgeIdsInPath: Array.from(prerequisiteEdgeIds),
    };
  }

  /**
   * Validate that the skill graph is a valid Directed Acyclic Graph (DAG) with no circular loops.
   */
  public static validateDAG(nodes: VisualizerNode[]): {
    isValidDAG: boolean;
    cycleNodeIds?: string[];
  } {
    const nodeMap = new Map<string, VisualizerNode>();
    nodes.forEach((n) => nodeMap.set(n.id, n));

    // 0: unvisited, 1: visiting, 2: visited
    const state = new Map<string, number>();
    const parent = new Map<string, string>();
    let cyclePath: string[] = [];

    const dfs = (nodeId: string): boolean => {
      state.set(nodeId, 1);
      const node = nodeMap.get(nodeId);

      if (node && node.dependents) {
        for (const depId of node.dependents) {
          const s = state.get(depId) || 0;
          if (s === 1) {
            // Cycle detected!
            cyclePath = [depId, nodeId];
            let curr = nodeId;
            while (parent.has(curr) && parent.get(curr) !== depId) {
              curr = parent.get(curr)!;
              cyclePath.push(curr);
            }
            return true;
          }
          if (s === 0) {
            parent.set(depId, nodeId);
            if (dfs(depId)) return true;
          }
        }
      }

      state.set(nodeId, 2);
      return false;
    };

    for (const node of nodes) {
      if ((state.get(node.id) || 0) === 0) {
        if (dfs(node.id)) {
          return {
            isValidDAG: false,
            cycleNodeIds: cyclePath,
          };
        }
      }
    }

    return { isValidDAG: true };
  }
}
