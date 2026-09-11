# Unit 40 Specification — Dependency Traversal Engine

## Goal

Implement the **Dependency Traversal Engine** (`frontend/src/components/visualizer/traversalEngine.ts`) for the Skill Graph Visualizer. This provides deterministic graph algorithms for the prerequisite DAG:
1. **Upstream Prerequisite Chain Traversal**: Computes all direct and transitive upstream prerequisites for any skill, separating satisfied from missing/blocking prerequisites.
2. **Downstream Dependent Path Traversal**: Computes all direct and transitive downstream skills impacted or enabled by a skill.
3. **Unlock Simulation**: Simulates the state transition of the graph when one or more candidate skills are verified, deterministically revealing which locked skills would become available.
4. **Target Goal Pathfinding**: Calculates the ordered, prerequisite-sorted learning path from a learner's current verified baseline to any target goal skill in the graph.
5. **DAG Cycle & Integrity Validation**: Detects any circular dependencies or disconnected graph anomalies.

## Dependencies

- Unit 08 (Roadmap Schema)
- Unit 13 (Skill State Engine)
- Unit 39 (Canvas & Node Render Model)

## Design

### 1. Data Contracts (`frontend/src/components/visualizer/types.ts`)

```typescript
export interface TraversalHighlightState {
  selectedNodeId: string | null;
  prerequisiteNodeIds: Set<string>;
  missingPrerequisiteNodeIds: Set<string>;
  prerequisiteEdgeIds: Set<string>;
  dependentNodeIds: Set<string>;
  dependentEdgeIds: Set<string>;
  unlockedEdgeIds: Set<string>;
}

export interface UnlockSimulationResult {
  simulatedSkillId: string;
  newlyUnlockedSkillIds: string[];
  alreadyAvailableOrVerifiedSkillIds: string[];
  stillLockedSkillIds: string[];
}

export interface LearningStep {
  skillId: string;
  name: string;
  status: SkillStatus;
  difficulty: SkillDifficulty;
  layer: number;
  isMissing: boolean;
}

export interface LearningPathResult {
  targetSkillId: string;
  targetSkillName: string;
  isAlreadyVerified: boolean;
  totalSteps: number;
  missingStepsCount: number;
  steps: LearningStep[];
  edgeIdsInPath: string[];
}
```

### 2. Traversal Engine Algorithm (`frontend/src/components/visualizer/traversalEngine.ts`)

- **`getUpstreamPrerequisites(targetId, nodes, edges)`**:
  - Breadth-First / Depth-First search traversing in reverse from target through `prerequisites`.
  - Collects all ancestor nodes and connecting edge IDs.
  - Classifies nodes with status !== `'verified'` as `missingPrerequisites`.
- **`getDownstreamDependents(sourceId, nodes, edges)`**:
  - Forward traversal through `dependents`.
  - Collects all descendant nodes and connecting edge IDs.
- **`simulateUnlock(candidateSkillIds, nodes)`**:
  - Treats current verified skills + candidate skills as verified.
  - For every locked node, checks if `prerequisites.every(p => verifiedOrCandidateSet.has(p))`.
  - Returns newly unlocked skills.
- **`findLearningPathToGoal(goalSkillId, nodes, edges)`**:
  - Collects all transitive prerequisites of `goalSkillId` plus the goal itself.
  - Topologically sorts the prerequisite subgraph by layer / dependency rank.
  - Filters and flags steps into a sequential curriculum.
- **`validateGraphDAG(nodes)`**:
  - Cycle detection using Kahn's algorithm or 3-color DFS.

### 3. Canvas Integration (`frontend/src/components/visualizer/SkillGraphCanvas.tsx`)

- Computes active `TraversalHighlightState` based on `selectedNodeId`.
- Highlights upstream edges in warning/amber and downstream edges in indigo/cyan.
- Highlights path edges and dims unrelated nodes/edges when a node or path is inspected.

## Invariants Protected

- Prerequisite logic remains completely deterministic.
- An unlocked skill strictly requires all prerequisite skills to be verified.
- Graph traversals handle edge cases such as multi-parent diamonds and empty graphs without infinite loops.

## Verification Checklist

- [ ] `types.ts` updated with traversal and learning path interfaces.
- [ ] `traversalEngine.ts` implements upstream traversal, downstream traversal, unlock simulation, goal pathfinding, and cycle detection.
- [ ] `SkillGraphCanvas.tsx` applies traversal highlights and dimming for focused exploration.
- [ ] `index.ts` exports `DependencyTraversalEngine`.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` compile cleanly with 0 errors.
- [ ] `context/progress-tracker.md` updated to reflect Unit 40 completion.
