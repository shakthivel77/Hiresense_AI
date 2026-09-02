# Unit 11 Specification — Roadmap Read API

## Goal

Expose REST API endpoints (`backend/src/roadmap/routes.ts`) allowing client applications to list supported domains and retrieve complete roadmap skill graphs.

## Dependencies

- Unit 01 through Unit 10

## Design

1. **Express Router (`backend/src/roadmap/routes.ts`)**:
   - `GET /api/roadmap/domains`:
     - Retrieves available domains via `roadmapService.getDomains()`.
     - Returns `200 OK` with payload `{ success: true, data: { domains } }`.
   - `GET /api/roadmap/:domainSlug`:
     - Validates `:domainSlug` parameter.
     - Retrieves domain skill graph via `roadmapService.getRoadmapGraph(domainSlug)`.
     - Returns `404 Not Found` if domain/roadmap does not exist (`{ success: false, error: { code: 'NOT_FOUND', message: 'Roadmap for domain not found' } }`).
     - Returns `200 OK` with payload `{ success: true, data: { domain, roadmap, nodes } }`.
2. **Mount in Server (`backend/src/index.ts`)**:
   - Mount `roadmapRouter` at `/api/roadmap`.

## Verification Checklist

- [ ] `GET /api/roadmap/domains` returns 200 with list of pre-seeded domains.
- [ ] `GET /api/roadmap/backend-developer` returns 200 with valid graph structure (`domain`, `roadmap`, `nodes`).
- [ ] `GET /api/roadmap/non-existent-slug` returns 404 with standard error format.
- [ ] `npm --prefix backend run build` passes with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
