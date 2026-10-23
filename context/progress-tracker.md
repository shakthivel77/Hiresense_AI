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
    - Created user-facing `ResumeView.tsx` in `frontend/src/components/resume/` supporting PDF upload, plain-text paste, and structured section visualization.
    - Guaranteed core invariant: all extracted items are stamped as `UNVERIFIED` claims.
  - **Unit 47 — Resume Skill Extraction & Ingestion UI**:
    - Spec `47-resume-skill-extraction.md`.
    - Implemented `ResumeSkillExtractor` in `backend/src/resume/skillExtractor.ts` and router in `backend/src/resume/routes.ts`.
    - Multi-pass taxonomy keyword & alias match engine matching canonical track skills across `backend-developer`, `frontend-developer`, `ai-data-engineer`.
    - Scans explicit skill tokens, work experience bullet points, and project tech stacks.
    - Stamped all extracted skills strictly as `UNVERIFIED` self-claims (`status: 'UNVERIFIED'`, `verificationScore: null`).
    - Provided `/api/resume/extract-skills` and `/api/resume/import-claims` REST endpoints.
    - Secured `POST /api/resume/import-claims` with `requireAuth` middleware, server-side `req.user.id` identity derivation, cross-user mismatch rejection (HTTP 403), and payload/skill ID validation.
    - Persisted validated claims via `skillService.claimSkill(authUserId, skillId, 'UNVERIFIED')` into skill store and Supabase `user_skills` table, queryable via `/api/skills/my-skills` and profile views.
    - Enforced strict invariants: claims remain `UNVERIFIED` with null verification score and 0 contribution to competency scores or ranking.
    - Implemented interactive candidate review & claim selection in `frontend/src/components/resume/ResumeView.tsx`.
    - Integrated with `frontend/src/App.tsx` sidebar navigation (`Resume Ingestion` with `FileText` icon) and dashboard quick actions.
    - Authored and verified comprehensive regression test suite in `backend/src/resume/resumeSecurityPersistence.test.ts` (9/9 scenarios passed) and live E2E server suite in `backend/src/resume/e2eLiveServerVerification.test.ts`.
  - **Unit 48 — Domain Diagnostic (COMPLETE)**:
    - Spec `48-domain-diagnostic.md`.
    - Implemented `DomainDiagnosticService` in `backend/src/assessment/diagnosticService.ts` and types in `backend/src/assessment/diagnosticTypes.ts`.
    - Dynamic multi-skill assessment session generator across 3 domain tracks: `backend-developer`, `frontend-developer`, `ai-data-engineer`.
    - Isolated per-skill scoring enforcing strict $\ge 80\%$ verification threshold.
    - Integrated automatic cryptographic proof generation (`proofService.createProofArtifact`) for all verified skills.
    - Synchronized verified skills into `skillService` and persisted user skills upon passing score.
    - Mounted `/api/assessment/diagnostic/tracks`, `/api/assessment/diagnostic/generate`, `/api/assessment/diagnostic/:diagnosticId`, and `/api/assessment/diagnostic/submit`.
    - Handled session expiration and repeated-submission prevention (`session.completed`).
    - Extended client API binding library in `frontend/src/lib/diagnosticApi.ts`.
    - Built complete user-facing `DomainDiagnosticView.tsx` in `frontend/src/components/diagnostic/`:
      - Track and custom skill selection phase with time estimates and domain descriptions.
      - Active assessment phase with live countdown timer, progress bar, question jump pills, and multiple-choice options.
      - Evaluating state and comprehensive results phase displaying overall score, per-skill status badge (`VERIFIED` vs `UNVERIFIED`), cryptographic proof cards with copy actions, and targeted roadmap remediation recommendations.
    - Integrated into application navigation shell (`App.tsx` sidebar with `Award` icon and dashboard quick actions).
    - Connected directly to `ResumeView.tsx` with one-click bridge to verify extracted claims via Domain Diagnostic.
    - Verified via automated test suite `backend/src/assessment/diagnosticVerification.test.ts`, live HTTP integration test suite `scratch/test_live_diagnostic.ts`, backend & frontend TypeScript checks, and frontend production build.
  - **Unit 49 — Assessment Integrity Signals**:
    - Spec `49-assessment-integrity-signals.md`.
    - Implemented `useAssessmentIntegrity` monitoring hook in `frontend/src/components/assessment/useAssessmentIntegrity.ts` tracking `visibilitychange`, `blur`/`focus`, `fullscreenchange`, and clipboard violations (`copy`/`paste`/`contextmenu`).
    - Added live Integrity HUD badge (`100% Clean`, `Integrity Warning`, `Integrity Flagged`) and real-time violation warning toasts in `TimedAssessmentModal.tsx`.
    - Implemented backend evaluation engine in `backend/src/assessment/testService.ts` computing integrity penalties, clamping to $[0, 100]$, and automatically flagging attempts with $> 3$ tab switches or integrity score $< 60$.
    - Enforced the core verification invariant: integrity-compromised attempts are disqualified (`passed = false`), stripped of cryptographic proof generation, and left `UNVERIFIED`.
    - Integrated integrity report and warning breakdown in `AssessmentResultView.tsx`.
    - Authored automated verification test suite in `backend/src/assessment/integrityVerification.test.ts`.
  - **Supabase Readiness & Diagnostic Security Hardening (COMPLETE)**:
    - Secured diagnostic endpoints (`/diagnostic/generate`, `/diagnostic/:diagnosticId`, `/diagnostic/submit`) with `requireAuth` middleware, strict server-side `req.user.id` derivation, and cross-user rejection (HTTP 403).
    - Bound diagnostic sessions to authenticated session owners (`session.userId`) and blocked cross-user viewing and submission.
    - Fixed core verification downgrade bug in `skillService.recordVerificationResult`: once verified, a subsequent failed attempt never downgrades a verified skill.
    - Eliminated fake random proof fallback (`PRF-...-Math.random()`); proofs are issued only when verification passes and persist reliably to PostgreSQL.
    - Created schema migration `003_verification_proofs_attempt_id.sql` converting `attempt_id` to `TEXT` to support multi-skill diagnostic attempt IDs cleanly.
    - Updated `skillService` and `proofService` to support live Supabase persistence using user tokens and backend admin credentials (`onConflict: 'user_id,skill_id'`, `onConflict: 'proof_id'`).
    - Verified real Supabase PostgreSQL persistence and server restart recovery against live project `ctlptseuqbwcyvrnohfo.supabase.co`.
    - Authored 8-scenario integration test suite in `backend/src/assessment/diagnosticSecurityPersistence.test.ts`.
  - **Multi-College Role-Based Platform & Centralized Content (COMPLETE)**:
    - Implemented 3 canonical enterprise roles: `STUDENT`, `MONITORING_ADMIN`, and `MAIN_ADMIN` with database constraint updates.
    - Migration `database/migrations/004_multi_college_roles_and_courses.sql` creating `colleges`, `monitoring_admin_colleges`, `student_affiliation_requests`, `courses`, `course_modules`, `course_subtopics`, `course_resources`, and `admin_audit_logs`.
    - Authorization middleware in `backend/src/auth/middleware.ts` (`requireRole`, `requireCollegeAccess`, active account status checks).
    - College Management & Student Affiliation in `backend/src/colleges/`:
      - Approved colleges public discovery (`/api/colleges/approved`).
      - Student affiliation requests (`/api/colleges/affiliations/request`) with status tracking (`UNCLAIMED`, `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`).
      - Mandatory institution registration notice in UI and optional official college email.
      - Main Admin review and approval workflow (`/api/admin/affiliations/:id`).
    - Monitoring Admin Provisioning & Strict Isolation:
      - Main Admin provisioning (`/api/admin/monitoring-admins/invite`) with multi-college assignments and account suspension/reactivation.
      - Multi-college isolation: Monitoring Admins can only query and export analytics/students for assigned colleges; all other college access strictly blocked with HTTP 403.
      - College CSV export (`/api/colleges/monitoring/:collegeId/export-csv`).
    - Centralized Learning Courses & Question Bank in `backend/src/courses/`:
      - Hierarchy: Course → Module → Subtopic → Learning Resources & Assessment Questions.
      - Lifecycle support: Draft, Edit, Publish, Archive.
      - Centralized Question Bank authoring with server-side answer key validation.
    - Frontend User Interfaces:
      - `AuthModal.tsx`: Updated with approved college dropdown, custom college requests, and recommended official college email.
      - `MainAdminDashboard.tsx`: Platform overview, college administration, affiliation requests, monitoring admin controls, and audit logs.
      - `MonitoringAdminDashboard.tsx`: Multi-college switcher, student counts, pass rates, skill gaps, verified roster, and CSV export.
      - `CourseCatalogView.tsx`: Modular syllabus viewer with learning outcomes, prerequisites, and resource links.
      - Navigation & Header in `App.tsx`: Dynamic role-based navigation tabs and verified institution badge.
    - Authored and verified 12-scenario automated test suite in `backend/src/colleges/collegeAdminSecurity.test.ts` (12/12 passed with zero failures).

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
