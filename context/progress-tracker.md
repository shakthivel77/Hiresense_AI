# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 4 — Job Analyzer Engine
- Status: In Progress (Units 01–31 Completed)

## Current Goal

- Implement Job Match & Gap UI (Unit 32).

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
- **Unit 28 — Job Posting Schema & Extractor Model**:
  - Spec `28-job-posting-schema.md`.
  - Implemented `JobPostingDTO`, `JobSkillRequirementDTO`, `CreateJobPostingInput`, and `ExtractedSkillsResult` in `backend/src/career/types.ts`.
  - Implemented `JobExtractorService` in `backend/src/career/jobExtractorService.ts`.
  - Implemented `JobPostingService` in `backend/src/career/jobPostingService.ts`.
- **Unit 29 — Deterministic Match Engine**:
  - Spec `29-deterministic-match-engine.md`.
  - Implemented `MatchedSkillItem`, `JobMatchAnalysisDTO`, `SkillMatchStatus`, and `ReadinessTier` in `backend/src/career/types.ts`.
  - Implemented `JobMatchEngine` in `backend/src/career/jobMatchEngine.ts`.
- **Unit 30 — Gap Analysis Engine**:
  - Spec `30-gap-analysis-engine.md`.
  - Implemented `PrerequisiteStepDTO`, `SkillGapRecommendationDTO`, `CareerGapAnalysisDTO`, and `GapPriority` in `backend/src/career/types.ts`.
  - Implemented `JobGapEngine` in `backend/src/career/jobGapEngine.ts`.
- **Unit 31 — Job Analyzer API**:
  - Spec `31-job-analyzer-api.md`.
  - Implemented `careerRouter` in `backend/src/career/routes.ts` (`GET /api/career/jobs`, `GET /api/career/jobs/:jobId`, `POST /api/career/jobs`, `POST /api/career/parse`, `POST /api/career/match/:jobId`, `POST /api/career/match-text`), mounted at `/api/career` in `backend/src/index.ts`.
  - Implemented client `frontend/src/lib/careerApi.ts` (`fetchJobPostings`, `fetchJobPostingById`, `createJobPosting`, `parseJobText`, `analyzeJobMatch`, `analyzeJobMatchText`).

## In Progress

- Unit 32 — Job Match & Gap UI.

## Next Up

1. **Unit 32 — Job Match & Gap UI**: Interactive split-screen job analyzer and career readiness dashboard finalizing Phase 4.
2. **Phase 5 — Interview Prep Engine**: Question bank, session engine, AI evaluator, and readiness score (Units 33–38).





















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
