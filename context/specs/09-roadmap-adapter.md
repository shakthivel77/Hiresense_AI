# Unit 09 Specification — Roadmap Adapter

## Goal

Provide a flexible roadmap adapter (`backend/src/roadmap/adapter.ts`) that converts external roadmap definitions into the internal `NormalizedRoadmapPayload` structure.

## Dependencies

- Unit 01 through Unit 08

## Design

1. **Adapter Interface (`backend/src/roadmap/adapter.ts`)**:
   - Interface `RoadmapAdapter`: `parseRoadmap(externalData: unknown): NormalizedRoadmapPayload`.
   - Implementation `StandardRoadmapAdapter`: Validates and transforms external JSON into `NormalizedRoadmapPayload` with normalized slugs, difficulty ratings, categories, and prerequisite relationships.
2. **Sample Datasets (`backend/src/roadmap/data/`)**:
   - Provide clean sample definitions for Backend Developer, Frontend Developer, and AI Engineer domains.

## Verification Checklist

- [ ] Adapter cleanly converts external JSON structure into `NormalizedRoadmapPayload`.
- [ ] Slugs are sanitized and deduplicated.
- [ ] `npm --prefix backend run build` passes with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
