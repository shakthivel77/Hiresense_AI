# Graph Report - Hiresence_AI  (2026-09-05)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 503 nodes · 999 edges · 23 communities (15 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `30b05925`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- interview/types.ts
- devDependencies
- careerApi.ts
- isSupabaseConfigured
- src/index.ts
- career/types.ts
- RoadmapView.tsx
- skills/service.ts
- interviewApi.ts
- compilerOptions
- proofService.ts
- PortfolioView.tsx
- backend/package.json
- TimedAssessmentModal.tsx
- compilerOptions
- SkillService
- ai/index.ts
- projects/index.ts
- ranking/index.ts

## God Nodes (most connected - your core abstractions)
1. `isSupabaseConfigured()` - 27 edges
2. `getSupabaseClient()` - 26 edges
3. `compilerOptions` - 18 edges
4. `useAuth()` - 17 edges
5. `SkillService` - 16 edges
6. `RoadmapService` - 14 edges
7. `ProofService` - 13 edges
8. `QuestionBankService` - 11 edges
9. `compilerOptions` - 11 edges
10. `InterviewQuestionDTO` - 10 edges

## Surprising Connections (you probably didn't know these)
- `CandidatePortfolioDTO` --references--> `DomainProgressDTO`  [EXTRACTED]
  backend/src/portfolio/types.ts → backend/src/skills/types.ts
- `ProofCardModalProps` --references--> `VerificationProof`  [EXTRACTED]
  frontend/src/components/portfolio/ProofCardModal.tsx → frontend/src/lib/portfolioApi.ts
- `VerificationProofCardProps` --references--> `VerificationProof`  [EXTRACTED]
  frontend/src/components/portfolio/VerificationProofCard.tsx → frontend/src/lib/portfolioApi.ts
- `DomainSelectorProps` --references--> `DomainDTO`  [EXTRACTED]
  frontend/src/components/roadmap/DomainSelector.tsx → frontend/src/types/roadmap.ts
- `SkillDetailModalProps` --references--> `SkillGraphNode`  [EXTRACTED]
  frontend/src/components/roadmap/SkillDetailModal.tsx → frontend/src/types/roadmap.ts

## Import Cycles
- None detected.

## Communities (23 total, 4 thin omitted)

### Community 0 - "interview/types.ts"
Cohesion: 0.09
Nodes (23): InterviewEvaluatorService, InterviewQuestionBankService, InterviewSessionService, StarFeedbackFormatterService, CreateInterviewSessionInput, EvaluationPerformanceTier, InterviewDifficulty, InterviewQuestionDTO (+15 more)

### Community 1 - "devDependencies"
Cohesion: 0.05
Nodes (44): autoprefixer, devDependencies, tsx, @types/cors, @types/express, @types/node, typescript, @types/node (+36 more)

### Community 2 - "careerApi.ts"
Cohesion: 0.07
Nodes (33): App(), HealthStatus, MainApp(), NavView, AuthModal(), AuthModalProps, JobAnalyzerView(), loadJobs() (+25 more)

### Community 3 - "isSupabaseConfigured"
Cohesion: 0.13
Nodes (18): QuestionBankService, QuestionSelectionService, TestService, CreateQuestionDTO, PublicQuestionDTO, PublicTestAttemptDTO, QuestionBankDTO, QuestionDifficulty (+10 more)

### Community 4 - "src/index.ts"
Cohesion: 0.10
Nodes (20): router, requireAuth(), router, AuthenticatedRequest, AuthenticatedUser, router, ApiResponse, app (+12 more)

### Community 5 - "career/types.ts"
Cohesion: 0.12
Nodes (20): JobExtractorService, SkillKeywordMap, JobGapEngine, JobMatchEngine, JobPostingService, CareerGapAnalysisDTO, CreateJobPostingInput, EmploymentType (+12 more)

### Community 6 - "RoadmapView.tsx"
Cohesion: 0.11
Nodes (30): DomainSelector(), DomainSelectorProps, RoadmapView(), RoadmapViewProps, SkillDetailModal(), SkillDetailModalProps, TabType, SkillNodeCard() (+22 more)

### Community 7 - "skills/service.ts"
Cohesion: 0.13
Nodes (19): ExternalRoadmapData, ExternalRoadmapNode, RoadmapAdapter, StandardRoadmapAdapter, RoadmapService, DomainDTO, NormalizedRoadmapPayload, RoadmapDTO (+11 more)

### Community 8 - "interviewApi.ts"
Cohesion: 0.07
Nodes (17): CreateInterviewSessionInput, EvaluationPerformanceTier, InterviewDifficulty, InterviewQuestion, InterviewQuestionType, InterviewRubricCriteria, InterviewSession, InterviewSessionQuestion (+9 more)

### Community 9 - "compilerOptions"
Cohesion: 0.08
Nodes (23): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+15 more)

### Community 10 - "proofService.ts"
Cohesion: 0.19
Nodes (8): PortfolioService, ProofService, CandidatePortfolioDTO, CreateProofParams, PortfolioStatsDTO, PublicProofCardDTO, VerificationProofDTO, VerificationStatus

### Community 11 - "PortfolioView.tsx"
Cohesion: 0.20
Nodes (15): PortfolioView(), ProofCardModal(), ProofCardModalProps, PublicVerificationModal(), PublicVerificationModalProps, VerificationProofCard(), VerificationProofCardProps, CandidatePortfolio (+7 more)

### Community 12 - "backend/package.json"
Cohesion: 0.11
Nodes (18): dependencies, cors, dotenv, express, @supabase/supabase-js, description, main, name (+10 more)

### Community 13 - "TimedAssessmentModal.tsx"
Cohesion: 0.21
Nodes (14): AssessmentResultView(), AssessmentResultViewProps, TimedAssessmentModal(), TimedAssessmentModalProps, PublicQuestion, PublicTestAttempt, QuestionEvaluationDetail, SkillAttemptStatusDTO (+6 more)

### Community 14 - "compilerOptions"
Cohesion: 0.14
Nodes (13): compilerOptions, esModuleInterop, forceConsistentCasingInFileNames, module, moduleResolution, outDir, resolveJsonModule, rootDir (+5 more)

## Knowledge Gaps
- **138 isolated node(s):** `InterviewDifficulty`, `InterviewQuestionType`, `InterviewRubricCriteria`, `InterviewSessionStatus`, `SessionQuestionStatus` (+133 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 162 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `isSupabaseConfigured()` connect `isSupabaseConfigured` to `interview/types.ts`, `src/index.ts`, `career/types.ts`, `skills/service.ts`, `proofService.ts`, `SkillService`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `getSupabaseClient()` connect `isSupabaseConfigured` to `interview/types.ts`, `src/index.ts`, `career/types.ts`, `skills/service.ts`, `proofService.ts`, `SkillService`?**
  _High betweenness centrality (0.041) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `careerApi.ts` to `PortfolioView.tsx`, `TimedAssessmentModal.tsx`, `RoadmapView.tsx`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `InterviewDifficulty`, `InterviewQuestionType`, `InterviewRubricCriteria` to the rest of the system?**
  _138 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `interview/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08897959183673469 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
- **Should `careerApi.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06871035940803383 - nodes in this community are weakly interconnected._