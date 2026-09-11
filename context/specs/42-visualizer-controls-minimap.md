# Unit 42 Specification — Visualizer Controls & Mini-Map

## Goal

Implement the **Visualizer Controls & Mini-Map** (`frontend/src/components/visualizer/MiniMap.tsx`, `frontend/src/components/visualizer/VisualizerControls.tsx`, and integration with `RoadmapView.tsx`) to complete Phase 6 (Skill Graph Visualizer). This provides navigation controls, instant skill search, category/difficulty filtering, layout direction toggle, an interactive bird's-eye mini-map, and seamless integration into the main Roadmap application view.

## Dependencies

- Unit 39 (Canvas & Node Render Model)
- Unit 40 (Dependency Traversal Engine)
- Unit 41 (Skill Profile Overlay)

## Design

### 1. Visualizer Mini-Map (`frontend/src/components/visualizer/MiniMap.tsx`)

- Renders a scaled, high-density SVG bird's-eye overview of the complete skill graph.
- Calculates node and edge bounding positions relative to the mini-map viewport.
- Shows current viewport bounding box overlay (`viewportRect`) mapped from the main `CanvasTransform`.
- Clicking or dragging on the mini-map smoothly recenters the main canvas to the targeted coordinates.

### 2. Search & Toolbar Controls (`frontend/src/components/visualizer/VisualizerControls.tsx`)

- **Instant Search**: Real-time text search filtering nodes by skill name, slug, or category.
- **Category Filter**: Filter nodes by specific technology domain categories.
- **Difficulty Filter**: Filter by Beginner, Intermediate, or Advanced.
- **Orientation Toggle**: Switch between Left-to-Right (`LR`) and Top-to-Bottom (`TB`) topological layout flows.
- **Reset View**: Button to reset zoom and pan to the default bounding frame.

### 3. Full Integration into `RoadmapView.tsx`

- In `frontend/src/components/roadmap/RoadmapView.tsx`, add a prominent view switcher:
  - **Graph Visualizer View** (`SkillGraphCanvas` + `VisualizerControls` + `MiniMap` + `SkillProfileOverlay`)
  - **Structured Tier View** (original category/tier card layout)
- Connecting node click and double click to the existing `SkillDetailModal` and `TimedAssessmentModal`.

## Invariants Protected

- Mini-map navigation remains synchronized with main canvas coordinates.
- Skill state and verification integrity remain consistent between Graph View and Tier View.

## Verification Checklist

- [ ] `MiniMap.tsx` implemented with scaled graph nodes, edges, and draggable viewport indicator.
- [ ] `VisualizerControls.tsx` provides search input, category filters, and layout orientation toggle.
- [ ] `RoadmapView.tsx` integrates the Graph Visualizer with seamless view switching between Graph and Tier modes.
- [ ] `index.ts` exports `MiniMap` and `VisualizerControls`.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` updated to mark Unit 42 and Phase 6 complete.
