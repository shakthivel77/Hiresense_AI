# Unit 41 Specification — Skill Profile Overlay

## Goal

Implement the **Skill Profile Overlay** (`frontend/src/components/visualizer/SkillProfileOverlay.tsx`) for the Skill Graph Visualizer. This component integrates real-time user competency records, verification scores, attempt statistics, and mastery metrics directly onto the interactive skill graph canvas.

## Dependencies

- Unit 13 (Skill State Engine)
- Unit 29 (Verified Skill API)
- Unit 39 (Canvas & Node Render Model)
- Unit 40 (Dependency Traversal Engine)

## Design

### 1. Data Contracts (`frontend/src/components/visualizer/types.ts`)

```typescript
export interface DomainMasterySummary {
  totalSkills: number;
  verifiedCount: number;
  availableCount: number;
  inProgressCount: number;
  lockedCount: number;
  masteryPercentage: number;
  averageVerificationScore: number;
}

export interface ProfileOverlayFilter {
  highlightMode: 'all' | 'verified_only' | 'available_only' | 'missing_prereqs' | 'unlocked_next';
  searchQuery: string;
}

export interface NodeProfileStats {
  skillId: string;
  status: SkillStatus;
  verificationScore?: number | null;
  attemptCount: number;
  maxAttempts: number;
  lastAttemptAt?: string | null;
  isReadyForAssessment: boolean;
  missingPrereqNames: string[];
}
```

### 2. Profile Overlay HUD (`frontend/src/components/visualizer/SkillProfileOverlay.tsx`)

- **Domain Mastery Bar**: Displays progress percentage, verified count, and average score.
- **Filter & Focus Controls**: Buttons to quickly highlight:
  - *All Nodes*
  - *Verified Skills* (green glow)
  - *Available / Ready to Assess* (cyan glow)
  - *Missing Prerequisites* (amber alert)
  - *Locked Skills* (dimmed)
- **Active Node Inspector Drawer**: Detailed panel when a node is selected showing:
  - Skill name, category, and difficulty.
  - Personal verification status and score.
  - Attempt limit tracker (e.g. 1 / 3 attempts used this month).
  - Prerequisite checklist with satisfied vs missing status indicators.
  - Quick action buttons: "Launch Assessment" (if available/ready) or "View Learning Path" (if locked).

### 3. Canvas Integration (`frontend/src/components/visualizer/SkillGraphCanvas.tsx`)

- Integrates `SkillProfileOverlay` directly on the canvas top/side layer.
- Node cards display attempt counts and "Ready for Assessment" pulse indicators on unlocked nodes.
- Applies filter dimming and glow rings based on the active overlay filter.

## Invariants Protected

- Verification status remains authoritative and reflects backend assessment records ($Score \ge 80\%$).
- Attempt count accurately reflects the 3-attempt monthly boundary.
- Unlocked state requires all prerequisites to be verified.

## Verification Checklist

- [ ] `types.ts` defines `DomainMasterySummary`, `ProfileOverlayFilter`, and `NodeProfileStats`.
- [ ] `SkillProfileOverlay.tsx` implemented with domain mastery stats, quick filters, and selected node inspector.
- [ ] `SkillGraphCanvas.tsx` integrated with profile overlay controls and interactive assessment launch callbacks.
- [ ] `index.ts` exports `SkillProfileOverlay`.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
