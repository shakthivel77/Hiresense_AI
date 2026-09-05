# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 5 — Interview Prep Engine (COMPLETE)
- Next: Phase 6 — Skill Graph Visualizer
- Status: In Progress (Units 01–38 Completed)

## Current Goal

- Implement Canvas & Node Render Model (Unit 39).

## Completed

- Project concept and constraints defined.
- Core product flow defined.
- Verified Skill Profile identified as the central entity.
- Modular-monolith architecture selected.
- Zero-budget constraint established.
- Roadmap adapter strategy established.
- AI/deterministic responsibility boundary established.
- Six-file context system created in repository root.
- **PHASE 0 COMPLETE (Units 01–07)**: Foundation, Env, DB Baseline, Auth API, Auth UI, Profile API, Profile UI.
- **PHASE 1 COMPLETE (Units 08–14 — Roadmap Engine)**: Internal Schema, Adapter, Ingestion, Read API, Roadmap UI Shell, Skill State Engine, Skill Detail UI.
- **PHASE 2 COMPLETE (Units 15–22 — Assessment Engine)**: Question Schema, Test/Attempt Schema, Question Selection Service, Assessment API, Timed Assessment UI, Scoring & Verification Engine, Attempt Limit Enforcement, Unlock Progression Engine.
- **PHASE 3 COMPLETE (Units 23–27 — Verification Portfolio)**: Verification Artifact Model, Portfolio Persistence & Compilation, Public Profile API, Shareable Portfolio UI, Proof Card Generator.
- **PHASE 4 COMPLETE (Units 28–32 — Job Analyzer Engine)**: Job Posting Schema & Extractor, Deterministic Match Engine, Gap Analysis Engine, Job Analyzer API, Job Match & Gap UI.
- **PHASE 5 COMPLETE (Units 33–38 — Interview Prep Engine)**:
  - **Unit 33 — Mock Interview Question Bank & Schema**: `InterviewQuestionDTO`, `InterviewRubricCriteria`, `InterviewQuestionType`, and `InterviewQuestionBankService`.
  - **Unit 34 — Interview Session Engine**: `InterviewSessionDTO`, `InterviewSessionQuestionDTO`, and `InterviewSessionService` managing staged question sequencing, pointer progression, and session states.
  - **Unit 35 — AI Response Evaluator**: `InterviewEvaluatorService` performing rubric-based scoring, anti-pattern checks, and performance tier classification.
  - **Unit 36 — STAR Method Feedback Formatter**: `StarFeedbackFormatterService` diagnosing Situation, Task, Action, Result completeness and structuring narrative reformulations.
  - **Unit 37 — Interview Prep API**: `interviewRouter` mounted at `/api/interview` and client library `interviewApi.ts`.
  - **Unit 38 — Mock Interview UI**: `MockInterviewView.tsx` with role track selection, simulated voice recording timers, live question navigation, real-time rubric checks, and comprehensive STAR performance reports.

## In Progress

- Unit 39 — Canvas & Node Render Model.

## Next Up

1. **Unit 39 — Canvas & Node Render Model**: Interactive skill graph canvas, pan/zoom engine, and deterministic layout.
2. **Unit 40 — Dependency Traversal Engine**: Prerequisite highlighting, unlock simulation, and pathfinding.
3. **Unit 41 — Skill Profile Overlay**: Real-time candidate mastery overlay onto the visual skill graph.




























## Open Questions

- Exact roadmap source/version and attribution/licensing workflow must be confirmed before importing external roadmap content.
- Exact supported roadmap domains for the first demo must be finalized.
- Exact free AI provider/model available through the team's existing tooling must be finalized.
- Exact free deployment provider should be selected only when deployment becomes necessary.
- Final ranking fallback behavior for users without project/interview data must be defined before ranking implementation.
- Exact assessment integrity violation policy should be finalized before implementing proctoring signals.

## Architecture Decisions

### StandardRoadmapAdapter

Reason: isolates roadmap normalization logic so any external open-source roadmap format can be imported without altering core system code.
