# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 0 — Architecture and Setup
- Status: Not started

## Current Goal

- Establish the Hiresense_AI repository structure, application stack, Supabase connection, authentication foundation, database baseline, and development workflow.

## Completed

- Project concept and constraints defined.
- Core product flow defined.
- Verified Skill Profile identified as the central entity.
- Modular-monolith architecture selected.
- Zero-budget constraint established.
- Roadmap adapter strategy established.
- AI/deterministic responsibility boundary established.
- Six-file context system created.

## In Progress

- None yet.

## Next Up

1. Initialize frontend and backend applications.
2. Configure TypeScript strict mode.
3. Configure Tailwind/UI primitives.
4. Configure Supabase project and environment variables.
5. Create initial database migration.
6. Implement authentication foundation.
7. Verify local development and production builds.

## Open Questions

- Exact roadmap source/version and attribution/licensing workflow must be confirmed before importing external roadmap content.
- Exact supported roadmap domains for the first demo must be finalized.
- Exact free AI provider/model available through the team's existing tooling must be finalized.
- Exact free deployment provider should be selected only when deployment becomes necessary.
- Final ranking fallback behavior for users without project/interview data must be defined before ranking implementation.
- Exact assessment integrity violation policy should be finalized before implementing proctoring signals.

## Architecture Decisions

### Modular Monolith

Reason: three-person team, approximately 55 days, zero budget, and final-year project scope do not justify distributed services.

### Supabase

Reason: combines PostgreSQL, authentication, and optional storage in one free-tier-oriented platform.

### Verified Skill Profile

Reason: self-declared skills are not reliable enough for the project's ranking and career-analysis features. Assessments provide a consistent verification mechanism.

### AIService Abstraction

Reason: the project depends on free/replaceable AI access. Provider lock-in would create unnecessary implementation risk.

### AI for Content, Backend for Rules

Reason: AI is useful for extraction/generation/evaluation, but deterministic business rules must remain reproducible and testable.

### Roadmap Adapter

Reason: external roadmap structures should not become the application's internal domain model.

## Session Notes

- The project should be implemented incrementally.
- Do not begin optional features until the mandatory end-to-end flow is stable.
- Maintain the 55-day deadline as a hard planning constraint.
- Preserve zero-budget assumptions.
