# Unit 12 Specification — Roadmap UI Shell

## Goal

Implement the React-based Roadmap UI Shell allowing learners to select learning domains, view normalized prerequisite-aware roadmap skill graphs, and inspect skills with distinct visual status indicators (locked, available, verified, in-progress).

## Dependencies

- Unit 01 through Unit 11 (especially Unit 11 Roadmap Read API)

## Design

1. **Domain Types & API Client (`frontend/src/types/roadmap.ts`, `frontend/src/lib/api.ts`)**:
   - TypeScript interfaces for `DomainDTO`, `RoadmapDTO`, `SkillDTO`, `SkillGraphNode`, and roadmap responses.
   - API fetch functions to query `/api/roadmap/domains` and `/api/roadmap/:domainSlug`.

2. **Roadmap Components (`frontend/src/components/roadmap/`)**:
   - `DomainSelector.tsx`: Domain card/pill selector showing domain title, description, and active selection state.
   - `RoadmapGraphView.tsx`: Structured visual roadmap graph organizing skills into logical progression stages/levels based on prerequisite topological depth, rendering connection lines/badges for prerequisites.
   - `SkillCard.tsx`: Interactive skill node displaying status badge (`LOCKED`, `AVAILABLE`, `IN_PROGRESS`, `VERIFIED`), difficulty indicator, category, and prerequisite indicators matching `ui-context.md`.
   - `SkillDrawer.tsx` / `SkillSummaryPanel.tsx`: Inspection drawer/panel showing selected skill details, prerequisite list, dependents, and entry-point to assessment/resources.

3. **App Integration (`frontend/src/App.tsx`)**:
   - Seamless navigation tab for "Roadmap" in the sidebar/header.
   - Error, loading, and empty states following `ui-context.md`.

## Verification Checklist

- [ ] Domain list loads dynamically from `GET /api/roadmap/domains`.
- [ ] Selecting a domain fetches its skill graph from `GET /api/roadmap/:domainSlug`.
- [ ] Skills are rendered with correct prerequisite-aware hierarchy and status states (Available, Locked, Verified, In-Progress).
- [ ] Clicking a skill opens a detailed inspection view highlighting prerequisite relations.
- [ ] Visual style adheres to `ui-context.md` (dark surface layers, semantic tokens, Lucide icons).
- [ ] `npm --prefix frontend run build` and `npm --prefix backend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
