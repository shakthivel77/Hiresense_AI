# Unit 10 Specification — Roadmap Import

## Goal

Provide a roadmap repository service (`backend/src/roadmap/service.ts`) capable of importing `NormalizedRoadmapPayload` datasets and resolving domain skill graphs.

## Dependencies

- Unit 01 through Unit 09

## Design

1. **Roadmap Repository & Service (`backend/src/roadmap/service.ts`)**:
   - `importRoadmap(payload: NormalizedRoadmapPayload)`: Stores domain, roadmap, skills, and prerequisite relationships.
   - `getDomains()`: Returns available domain list.
   - `getRoadmapGraph(domainSlug: string)`: Resolves skill nodes with their prerequisites and dependents.
2. **Pre-seeded Initial Domains**:
   - Pre-load standard domains (Backend Developer, Frontend Developer, AI & Data Engineer).

## Verification Checklist

- [ ] Import logic creates skills and maps prerequisite dependencies accurately.
- [ ] `getRoadmapGraph` resolves complete skill graph for supported domains.
- [ ] `npm --prefix backend run build` passes with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
