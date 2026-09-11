# Unit 39 Specification — Canvas & Node Render Model

## Goal

Create the Canvas & Node Render Model for the Skill Graph Visualizer (`frontend/src/components/visualizer/`), implementing a deterministic topological DAG layout algorithm, smooth interactive pan/zoom canvas viewport, and crisp SVG node/edge rendering with status and category styling.

## Dependencies

- Unit 08 (Roadmap Schema)
- Unit 09 (Roadmap Ingestion & Adapter)
- Unit 13 (Skill State Engine)

## Design

1. **Visualizer Models (`frontend/src/components/visualizer/types.ts`)**:
   - `VisualizerNode`: Position (`x`, `y`), dimensions, topological level/layer, skill metadata, verification status (`locked`, `available`, `in_progress`, `verified`), selection, and highlight flags.
   - `VisualizerEdge`: Source & target node coordinates, cubic Bezier curve paths, dependency relationship type, and highlight states.
   - `CanvasTransform`: Translation (`x`, `y`) and `scale` (zoom level clamped between $0.25\times$ and $2.5\times$).
   - `LayoutConfig`: Node spacing, rank separations, and orientation (`LR` or `TB`).

2. **Deterministic Layout Engine (`frontend/src/components/visualizer/layoutEngine.ts`)**:
   - Performs topological sorting over skill prerequisite edges.
   - Groups nodes into dependency ranks (Layer $0 \to 1 \to 2 \dots$).
   - Computes deterministic $(x, y)$ grid coordinates with centered horizontal distribution to prevent overlapping.
   - Generates curved Bezier paths (`M x1,y1 C cx1,cy1 cx2,cy2 x2,y2`) connecting output ports to input ports.
   - Computes total graph bounding box for auto-fitting viewport.

3. **Interactive Canvas Viewport (`frontend/src/components/visualizer/SkillGraphCanvas.tsx`)**:
   - Pan by click-and-drag on background canvas.
   - Smooth Zoom via mouse wheel or zoom toolbar controls.
   - High-DPI crisp SVG edge rendering with arrowhead markers.
   - Rich interactive node cards displaying title, category chip, difficulty rating, and verification status badge.
   - Node selection and hover glow states.
   - `fitView` helper to auto-center and frame the entire graph.

## Invariants Protected

- Node positions are computed deterministically from the roadmap DAG without arbitrary floating forces.
- Statuses display authentic backend verification states.

## Verification Checklist

- [ ] `types.ts` defines `VisualizerNode`, `VisualizerEdge`, and `CanvasTransform`.
- [ ] `layoutEngine.ts` calculates hierarchical topological layers and Bezier edge paths.
- [ ] `SkillGraphCanvas.tsx` provides pan, zoom, fit-to-view, and interactive node selection.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
