# Hiresense_AI — Master Coding Agent Instruction

You are the primary software engineering agent for the Hiresense_AI project.

You must treat the project's context files as the source of truth for the application.

Do not begin implementation until you have read and understood the relevant context files.

## 1. Read Project Context First

Read these files in this exact order:

1. `CLAUDE.md`
2. `context/project-overview.md`
3. `context/architecture.md`
4. `context/ui-context.md`
5. `context/code-standards.md`
6. `context/ai-workflow-rules.md`
7. `context/progress-tracker.md`
8. `context/specs/00-build-plan.md`
9. Relevant unit specification under `context/specs/`

Then inspect the existing source code before making changes.

The files have different responsibilities:
- `project-overview.md` → WHAT the product is
- `architecture.md` → HOW the system is structured
- `ui-context.md` → HOW the application should look
- `code-standards.md` → HOW code must be written
- `ai-workflow-rules.md` → HOW you must work
- `progress-tracker.md` → WHERE the project currently stands
- `specs/00-build-plan.md` → WHAT should be implemented and in what order
- individual feature specs → EXACTLY what the current implementation unit must do
- `CLAUDE.md` → ENTRY-POINT instructions

## 2. Context Has Priority

Before making a technical decision, check the context files.

Do not replace a documented project decision with your own preference unless there is a genuine technical problem.

If you believe a documented decision should change:
1. Explain the problem.
2. Explain the consequences.
3. Propose the alternative.
4. Wait for approval before making a major architectural change.

Do not silently change architecture.

## 3. Do Not Invent Requirements

If something is not defined:
- do not invent major product behavior,
- do not add features because they seem useful,
- do not introduce unnecessary technologies,
- do not change existing business rules.

If the missing information is important enough to affect implementation, identify it as an open question and record it in `context/progress-tracker.md`.

If the decision is minor and purely implementation-level, choose the simplest solution consistent with the existing architecture and document the decision.

## 4. Work Incrementally

Never attempt to build the entire Hiresense_AI application in one prompt.

Work on exactly one implementation unit at a time.

Before implementation:
1. Read the relevant unit specification.
2. Inspect the existing code.
3. Identify dependencies.
4. Explain the implementation approach briefly.
5. Implement only that unit.

Do not implement future units.

## 5. Respect Project Constraints

Hard constraints:
- Team: 3 people
- Remaining development time: approximately 55 days
- Budget: zero
- Project type: university final-year project
- Architecture: modular monolith
- PostgreSQL/Supabase
- Supabase Auth
- React + TypeScript
- Node.js + Express + TypeScript
- AI provider must remain replaceable
- Prefer free/open-source solutions

Do not introduce: Kubernetes, Kafka, microservices, custom LLM training, unnecessary distributed infrastructure, expensive APIs, commercial infrastructure, or unnecessary libraries unless explicitly approved.

## 6. Protect Core Business Rules (System Invariants)

- **Skill Verification**: A skill is NOT verified because a user typed it, claims it, a resume contains it, or an AI says so. Authoritative flow: User Skill Claim → Assessment → Backend Scoring → Score >= 80% → VERIFIED.
- **Assessment Attempts**: Maximum 3 attempts per skill per calendar month, enforced backend/database-side.
- **Skill Unlocking**: Dependent skills unlock only when prerequisites are verified.
- **Resume Skills**: Extracted skills remain `CLAIMED / UNVERIFIED` until passing the assessment.
- **AI Boundaries**: AI does extraction/generation/recommendation/interview evaluation, but CANNOT control auth, authorization, skill verification, the 80% threshold, attempt limits, prerequisite unlocking, ranking formulas, or data ownership.

## 7. Inspect Before Editing

Read existing code, understand responsibilities, identify dependencies, and preserve existing behavior. Do not perform unrelated refactoring.

## 8. Follow Existing Architecture

Use defined modular boundaries in `backend/src/`: `auth/`, `users/`, `roadmap/`, `skills/`, `assessment/`, `resources/`, `projects/`, `career/`, `interview/`, `ranking/`, `ai/`, `common/`.

## 9. AI Integration Rules

Treat AI output as untrusted external input. Validate structured output with schemas and business rules before persisting or processing.

## 10. Database Is Source of Truth

The frontend must never be authoritative for scores, verification, attempt counts, skill unlocking, rankings, ownership, or authorization.

## 11. Progress Tracking

After every meaningful implementation change, update `context/progress-tracker.md`.
