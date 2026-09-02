# Hiresense_AI — Application Building Context

Read the following files in order before implementing or making any architectural decision:

1. `context/project-overview.md` — product definition, goals, features, and scope.
2. `context/architecture.md` — system structure, boundaries, storage model, auth model, and invariants.
3. `context/ui-context.md` — theme, colors, typography, layout, and component conventions.
4. `context/code-standards.md` — TypeScript, React, API, database, AI, and testing rules.
5. `context/ai-workflow-rules.md` — development workflow, scoping rules, missing-requirement handling, and verification.
6. `context/progress-tracker.md` — current phase, completed work, open questions, architecture decisions, and next steps.
7. `context/specs/00-build-plan.md` — implementation unit order and dependencies.
8. Read the specific unit spec before implementing that unit.

## Operating Rules

- Work on one feature unit at a time.
- Do not go beyond the scope of the current unit.
- Do not invent missing product behavior.
- Preserve the modular-monolith architecture.
- Keep business rules on the backend.
- Treat AI output as untrusted until validated.
- Never allow resume claims to become verified skills without assessment.
- Never allow the frontend to authoritatively set verification, scores, attempt counts, rankings, or ownership.
- Keep AI providers replaceable.
- Prefer free/open-source solutions.
- Avoid unnecessary infrastructure and dependencies.
- Update `context/progress-tracker.md` after every meaningful implementation change.
- If implementation changes architecture, scope, storage, auth, or standards, update the relevant context file before continuing.
- Before closing a unit, run the relevant tests and `npm run build`.

## Current Project Constraint

Hiresense_AI is a three-person university final-year project with approximately 55 days remaining and a zero budget. Completion of the core end-to-end flow is more important than adding advanced features.

## Definition of Done

A unit is complete only when:

- its specified behavior works,
- its scope has not expanded,
- required validation and authorization are present,
- no architecture invariant is violated,
- tests/build pass,
- progress tracker is updated.
