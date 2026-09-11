# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 7 — Ranking & Leaderboard Engine: COMPLETE (Units 01–45 Completed)
- Next Phase: Phase 8 — Advanced Extensions & System Hardening

## Current Goal

- Begin Phase 8: Advanced Extensions, Diagnostics & System Hardening.

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
- **PHASE 5 COMPLETE (Units 33–38 — Interview Prep Engine)**: Question Bank, Session Engine, AI Response Evaluator, STAR Method Feedback Formatter, Interview Prep API, Mock Interview UI.
- **PHASE 6 COMPLETE (Units 39–42 — Skill Graph Visualizer)**:
  - **Unit 39 — Canvas & Node Render Model**: `VisualizerNode`, `VisualizerEdge`, `CanvasTransform`, `LayoutBounds` in `types.ts`; `LayoutEngine.computeLayout` for deterministic DAG positioning and Bezier curves; `SkillGraphCanvas.tsx` viewport.
  - **Unit 40 — Dependency Traversal Engine**: `DependencyTraversalEngine` in `traversalEngine.ts`; upstream prerequisite traversal, downstream unlock tracking, unlock simulation (`simulateUnlock`), curriculum goal pathfinding (`findLearningPathToGoal`), and cycle validation (`validateDAG`).
  - **Unit 41 — Skill Profile Overlay**: `SkillProfileOverlay.tsx`; real-time domain competency HUD, verification scores, attempt limits (1-3 attempts/month), missing prerequisite alerts, and direct assessment triggers.
  - **Unit 42 — Visualizer Controls & Mini-Map**: `MiniMap.tsx` with interactive viewport navigation; `VisualizerControls.tsx` with instant search, category filters, difficulty filters, and Left-to-Right / Top-to-Bottom orientation toggle; full integration into `RoadmapView.tsx` with seamless switcher between Visual Graph Canvas and Tier Stages.
- **PHASE 7 COMPLETE (Units 43–45 — Ranking & Leaderboard Engine)**:
  - **Unit 43 — Score Components & Normalization**:
    - Spec `43-score-components-normalization.md`.
    - Implemented `ScoreEngine` in `backend/src/ranking/scoreEngine.ts` and types in `backend/src/ranking/types.ts`.
    - Deterministic 5-component weighting formula: Skill Mastery (40%), Skill Difficulty (20%), Domain Coverage (15%), Project Performance (15%), Interview Performance (10%).
    - Deterministic difficulty weighting ($1.0 \times$ Beginner, $1.5 \times$ Intermediate, $2.0 \times$ Advanced).
    - Competency tier classification (`NOVICE`, `APPRENTICE`, `PROFICIENT`, `EXPERT`, `MASTER`).
  - **Unit 44 — Deterministic Hiresense Competency Score & Leaderboard API**:
    - Spec `44-leaderboard-api.md`.
    - Implemented `RankingService` in `backend/src/ranking/rankingService.ts` and router in `backend/src/ranking/routes.ts`.
    - Mounted `/api/ranking` in `backend/src/index.ts`.
    - Provided `/api/ranking/my-score`, `/api/ranking/score/:userId`, `/api/ranking/leaderboard`, and `/api/ranking/distribution`.
    - Multi-scope ranking query support (global, domain, institution, tier, search).
    - Client API binding library in `frontend/src/lib/rankingApi.ts`.
  - **Unit 45 — Leaderboard & Readiness UI**:
    - Spec `45-leaderboard-readiness-ui.md`.
    - Implemented `frontend/src/components/ranking/`:
      - `ScoreOverviewCard.tsx`: Candidate 5-component competency HUD, tier badging, formula breakdown drawer.
      - `LeaderboardFilters.tsx`: Multi-scope selector (Global, Track, Institution), tier filter pills, search input.
      - `LeaderboardTable.tsx`: Ranked candidate table with medal accents (#1 Gold, #2 Silver, #3 Bronze), tier indicators, and verifications summary.
      - `DistributionAnalytics.tsx`: Aggregate distribution visualizer with tier population bars and top institution benchmarks.
      - `CandidateScoreModal.tsx`: Drill-down inspection modal for any candidate's 5-factor weighted metrics.
      - `LeaderboardView.tsx`: Integrated master view with view switcher and API synchronization.
    - Integrated into `frontend/src/App.tsx` sidebar navigation and dashboard quick cards.
- **PHASE 8 — Advanced Extensions & Ingestion**:
  - **Unit 46 — Resume Text Extraction**:
    - Spec `46-resume-text-extraction.md`.
    - Implemented `ResumeExtractor` in `backend/src/resume/resumeExtractor.ts` and router in `backend/src/resume/routes.ts`.
    - Sanitizes input streams (PDF Base64 and plain text), strips scripts/control chars, normalizes bullet points.
    - Segments resume text into structured sections: `contact`, `summary`, `experience`, `education`, `rawSkillsText`, `projects`, and `certifications`.
    - Mounted `/api/resume` in `backend/src/index.ts`.
    - Exported frontend API client in `frontend/src/lib/resumeApi.ts`.
    - Guaranteed core invariant: all extracted items are stamped as `UNVERIFIED` claims.
  - **Unit 47 — Resume Skill Extraction**:
    - Spec `47-resume-skill-extraction.md`.
    - Implemented `ResumeSkillExtractor` in `backend/src/resume/skillExtractor.ts` and router in `backend/src/resume/routes.ts`.
    - Multi-pass taxonomy keyword & alias match engine matching canonical track skills across `backend-developer`, `frontend-developer`, `ai-data-engineer`.
    - Scans explicit skill tokens, work experience bullet points, and project tech stacks.
    - Stamped all extracted skills strictly as `UNVERIFIED` self-claims (`status: 'UNVERIFIED'`, `verificationScore: null`).
    - Provided `/api/resume/extract-skills` and `/api/resume/import-claims` REST endpoints.
  - **Unit 48 — Domain Diagnostic**:
    - Spec `48-domain-diagnostic.md`.
    - Implemented `DomainDiagnosticService` in `backend/src/assessment/diagnosticService.ts` and types in `backend/src/assessment/diagnosticTypes.ts`.
    - Dynamic multi-skill assessment session generator across track curricula and unverified resume claims.
    - Isolated per-skill scoring enforcing strict $\ge 80\%$ verification threshold.
    - Integrated automatic cryptographic proof generation (`proofService.createProofArtifact`) for all verified skills.
    - Mounted `/api/assessment/diagnostic/generate`, `/api/assessment/diagnostic/:diagnosticId`, and `/api/assessment/diagnostic/submit`.
    - Created client API binding library in `frontend/src/lib/diagnosticApi.ts`.
  - **Unit 49 — Assessment Integrity Signals**:
    - Spec `49-assessment-integrity-signals.md`.
    - Implemented `useAssessmentIntegrity` monitoring hook in `frontend/src/components/assessment/useAssessmentIntegrity.ts` tracking `visibilitychange`, `blur`/`focus`, `fullscreenchange`, and clipboard violations (`copy`/`paste`/`contextmenu`).
    - Added live Integrity HUD badge (`100% Clean`, `Integrity Warning`, `Integrity Flagged`) and real-time violation warning toasts in `TimedAssessmentModal.tsx`.
    - Implemented backend evaluation engine in `backend/src/assessment/testService.ts` computing integrity penalties, clamping to $[0, 100]$, and automatically flagging attempts with $> 3$ tab switches or integrity score $< 60$.
    - Enforced the core verification invariant: integrity-compromised attempts are disqualified (`passed = false`), stripped of cryptographic proof generation, and left `UNVERIFIED`.
    - Integrated integrity report and warning breakdown in `AssessmentResultView.tsx`.
    - Authored automated verification test suite in `backend/src/assessment/integrityVerification.test.ts`.

## In Progress

- (Ready for Next Unit)

## Next Up

1. **Unit 50 — GitHub Analysis**: Candidate repository and public contribution summary engine.
2. **Unit 51 — Verification Status Breakdown**: Comprehensive candidate verification dashboard combining resume, assessments, integrity metrics, and proofs.
3. **Phase 9 — Integration and Freeze (Units 52–56)**: End-to-end user journeys, security verification, reliability passes, and final demo presentation.





























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
