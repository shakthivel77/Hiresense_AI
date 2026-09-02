# Unit 08 Specification — Roadmap Internal Schema

## Goal

Define the internal normalized domain models, data transfer objects (DTOs), and skill graph types for roadmaps in `backend/src/roadmap/types.ts`.

## Dependencies

- Unit 01 through Unit 07 (Phase 0 Complete)

## Design

1. **Normalized Internal Types (`backend/src/roadmap/types.ts`)**:
   - `DomainDTO`: `id`, `slug`, `name`, `description`.
   - `RoadmapDTO`: `id`, `domainId`, `title`, `version`, `description`.
   - `SkillDTO`: `id`, `slug`, `name`, `description`, `category`, `difficulty` (`beginner` | `intermediate` | `advanced`).
   - `SkillDependencyDTO`: `id`, `skillId`, `prerequisiteSkillId`.
   - `SkillGraphNode`: `skill: SkillDTO`, `prerequisites: string[]`, `dependents: string[]`.
   - `NormalizedRoadmapPayload`: Standardized DTO payload structure output by roadmap adapters.

## Verification Checklist

- [ ] `backend/src/roadmap/types.ts` compiles cleanly with strict mode TypeScript.
- [ ] Internal types are decoupled from external roadmap.sh / third-party schemas.
- [ ] `npm --prefix backend run build` passes with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
