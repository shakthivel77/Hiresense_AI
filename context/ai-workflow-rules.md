# Hiresense_AI — AI Workflow Rules

## Approach

Build Hiresense_AI incrementally using a **spec-driven, context-first workflow**.

The context files define what to build, how to build it, and the current state. Always implement against these specifications. Do not infer or invent product behavior from scratch.

The developer remains the architect. The AI coding agent is the implementation engine.

## Context Loading

Before implementation or architectural decisions, read:

1. `context/project-overview.md`
2. `context/architecture.md`
3. `context/ui-context.md`
4. `context/code-standards.md`
5. `context/ai-workflow-rules.md`
6. `context/progress-tracker.md`
7. The relevant feature spec under `context/specs/`

The root `CLAUDE.md`/agent entry file defines this reading order. fileciteturn0file6L3-L24

## Scoping Rules

- Work on one feature unit at a time.
- Prefer small, verifiable increments over large speculative changes.
- Do not combine unrelated system boundaries in a single implementation step.
- Do not add future features while implementing the current unit.
- Introduce dependencies just in time.
- Preserve existing architecture unless an explicit architectural decision changes it.

## When to Split Work

Split an implementation step if it combines:

- unrelated UI and backend behavior,
- multiple unrelated API routes,
- database migrations and unrelated UI redesign,
- AI generation and unrelated assessment changes,
- behavior not clearly defined in the context files,
- more than one independently verifiable user-visible result.

If a change cannot be verified end to end quickly, the scope is too broad. Split it.

## Handling Missing Requirements

- Do not invent product behavior that is not defined.
- If a requirement is ambiguous, identify the ambiguity before implementing.
- If the decision is necessary for implementation, record it under `Open Questions` in `progress-tracker.md` and resolve it before proceeding.
- If the issue is low-risk and only concerns an implementation detail, choose the simplest solution consistent with the architecture and document the decision.
- Never silently change a product rule.

## Protected Areas

Do not modify third-party library internals.

Do not rewrite unrelated modules merely to make a local implementation easier.

Do not remove or rename context files without explicit instruction.

## Documentation Sync

Update the relevant context file whenever implementation changes:

- system architecture or boundaries,
- storage model,
- authentication/access model,
- code conventions,
- feature scope,
- important business rules.

Update `progress-tracker.md` after every meaningful implementation change.

## Verification Before Moving On

Before closing a unit:

1. The unit works end to end within its defined scope.
2. No invariant in `architecture.md` was violated.
3. `progress-tracker.md` reflects the completed work.
4. Relevant tests pass.
5. No TypeScript errors remain.
6. No obvious browser console errors remain.
7. API input and ownership validation are present where required.
8. `npm run build` passes for the affected application.
9. No unrelated feature was changed.

## AI-Specific Workflow

For AI-generated code:

1. Read the relevant spec.
2. Inspect existing implementation before modifying it.
3. Reuse existing abstractions where appropriate.
4. Implement only the requested unit.
5. Validate types and schemas.
6. Run tests/build.
7. Report files changed and verification results.
8. Update progress tracker.

For AI-generated content such as assessment questions:

1. Generate structured output.
2. Validate schema.
3. Reject malformed output.
4. Check for missing answer keys/explanations.
5. Store only validated content.
6. Prefer generation during preparation/admin workflows.
7. Reuse stored question pools.

## Correction Workflow

If implementation differs from the spec:

- identify the exact mismatch,
- state expected behavior,
- fix only the mismatch,
- do not refactor unrelated code.

If a bug appears:

- identify the root cause,
- reproduce it,
- fix the root cause,
- add or update a regression test where practical,
- avoid stacking a workaround on top of the defect.

## Feature Freeze

Once the project enters the final integration/freeze period:

- no major architecture changes,
- no new high-risk dependencies,
- no large new features,
- prioritize reliability, testing, documentation, and demo readiness.
