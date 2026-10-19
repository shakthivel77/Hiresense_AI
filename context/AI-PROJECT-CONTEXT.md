# Hiresense_AI — Master AI Project Context Document
**Forensic Technical Audit, Architectural Specification & System Knowledge Base**

---

## 1. Master Project Summary & Identity

- **Project Name**: Hiresense_AI (also referenced as `Hiresense` or `hiresense-ai`)
- **Nature of Project**: University Final-Year Engineering Capstone Project
- **Target Audience**: Computer Science and Software Engineering learners, job candidates, academic evaluators, and technical recruiters
- **Core Value Proposition**: An AI-enabled learning and career-readiness platform that replaces self-declared skill claims with verifiable competency proof.
- **Central Paradigm**:
  $$\text{Learn} \longrightarrow \text{Assess} \longrightarrow \text{Verify} \longrightarrow \text{Build Competency Profile} \longrightarrow \text{Analyze Career Gap} \longrightarrow \text{Practice Interview} \longrightarrow \text{Measure Readiness} \longrightarrow \text{Ranking}$$
- **Architectural Style**: Modular Monolith (Express.js backend, React frontend, PostgreSQL database via Supabase, with dual-mode in-memory resilience)
- **Zero-Budget Constraint**: Operates entirely with zero cloud/API spend; utilizes deterministic heuristics and algorithms in place of expensive third-party LLM APIs.
- **Repository Version**: `0.1.0`
- **Head Commit**: `0bfaae0` (*feat: complete Units 39-49 — DAG Visualizer, Ranking Engine, Resume Extraction, Domain Diagnostic & Assessment Integrity Signals*)
- **Audit Verification State**:
  - Backend TypeScript Typecheck: **100% Clean (0 errors)**
  - Frontend TypeScript Typecheck: **100% Clean (0 errors)**
  - Automated Verification Suites: **5 of 5 Test Suites Passing (100%)**

---

## 2. Problem Statement, Objectives & Conceptual Workflow

### 2.1 Problem Statement
In traditional hiring and self-directed technical education, candidates present self-declared resumes and certificate claims that are trivial to forge, inflate, or fabricate. Recruiters and engineering managers face a high signal-to-noise ratio and cannot verify if a candidate possesses practical, prerequisite-backed engineering competency. Conversely, learners lack structured, dependency-aware guidance indicating what to learn next, why they are locked from advanced topics, and how their verified skills map to actual industry job descriptions.

### 2.2 Proposed Solution: Hiresense_AI
Hiresense_AI establishes an authoritative verification pipeline:
1. **Curriculum as a DAG**: Skills are organized into Directed Acyclic Graphs (DAGs) where advanced skills are strictly locked until prerequisites are mastered.
2. **Authoritative Verification Invariant**: A skill is never verified through self-assertion, resume claims, or prompt injection. Verification strictly requires achieving $\ge 80.0\%$ on a timed, proctored server-side assessment.
3. **Cryptographic Proof Artifacts**: Passing candidates receive tamper-evident, SHA-256 HMAC-signed verification proofs with shareable URLs and embeddable SVG badges.
4. **Deterministic Career Gap Analysis**: Job postings are parsed and matched against verified skills with transparent mathematical weighting, never fabricating hiring probabilities.
5. **Heuristic AI Mock Interviews**: Candidates complete structured behavioral and technical interviews evaluated against detailed rubric signals and the STAR method.
6. **Unified Competency Score & Leaderboards**: A 5-factor normalized score ranks candidates globally and by university without black-box bias.

---

## 3. Intended Architecture vs. Actual Implemented Architecture

A forensic comparison between the initial specification (`context/specs/00-build-plan.md`, `CLAUDE.md`, `architecture.md`) and the actual codebase (`backend/src/`, `frontend/src/`, `database/`):

| Architectural Area | Intended / Specified | Actually Implemented | Status | Evidence & Forensic Details |
|---|---|---|---|---|
| **System Structure** | Modular Monolith in Node.js / Express / TypeScript | Modular Monolith with 14 distinct domain folders in `backend/src/` | **COMPLETE** | `backend/src/index.ts`, `backend/tsconfig.json` |
| **Database Persistence** | PostgreSQL via Supabase with relational migrations | Dual-mode: Supabase client with seamless in-memory fallback Maps | **COMPLETE (RESILIENT)** | `database/migrations/001_initial_schema.sql`, `backend/src/common/supabase.ts` |
| **Authentication** | Supabase Auth (JWT Bearer) | Supabase Auth Bearer validation with `mock-dev-token` bypass for local development | **COMPLETE** | `backend/src/auth/middleware.ts`, `frontend/src/context/AuthContext.tsx` |
| **Roadmap Ingestion** | Open-source roadmap adapter (e.g. roadmap.sh) | `StandardRoadmapAdapter` ingesting normalized payloads into hierarchical DAGs | **COMPLETE** | `backend/src/roadmap/adapter.ts`, `backend/src/roadmap/service.ts` |
| **Skill State Engine** | Lock/Available/Verified states based on prerequisites | Dynamic graph evaluator computing `LOCKED`, `AVAILABLE`, `IN_PROGRESS`, `VERIFIED` | **COMPLETE** | `backend/src/skills/service.ts`, `frontend/src/components/roadmap/RoadmapView.tsx` |
| **Interactive Visualizer** | Visual DAG canvas with minimap and traversal | Interactive 2D HTML Canvas with Bezier curves, topological traversal, and HUD overlay | **COMPLETE** | `frontend/src/components/visualizer/` (Units 39–42) |
| **Assessment Engine** | Timed tests, 80% passing rule, 3 attempts/month limit | Server-side timed test lifecycle, randomized questions, 3 attempts/month enforcement | **COMPLETE** | `backend/src/assessment/testService.ts`, `backend/src/assessment/routes.ts` |
| **Assessment Integrity** | Basic browser event tracking for anti-cheating | Real-time hook tracking blur, tab switches, fullscreen, clipboard; disqualifies $> 3$ tab switches or score $< 60$ | **COMPLETE** | `frontend/src/components/assessment/useAssessmentIntegrity.ts`, `backend/src/assessment/integrityVerification.test.ts` |
| **Verification Proofs** | Verifiable skill certificate model | Cryptographic SHA-256 HMAC proof generator, public verification endpoint, standalone SVG badge | **COMPLETE** | `backend/src/portfolio/proofService.ts`, `frontend/src/components/portfolio/VerificationProofCard.tsx` |
| **Job Analyzer Engine** | Job description parsing & skill gap analysis | Deterministic regex taxonomy keyword matcher, required (1.0) vs preferred (0.5) weighting | **COMPLETE** | `backend/src/career/jobExtractorService.ts`, `jobMatchEngine.ts`, `jobGapEngine.ts` |
| **AI Mock Interview** | LLM-generated questions & interview answer scoring | Deterministic rubric-based signal matching engine (keySignals, antiPatterns, word count, STAR formatter) | **COMPLETE (HEURISTIC)** | `backend/src/interview/interviewEvaluatorService.ts`, `interviewQuestionBankService.ts` |
| **External LLM Integration** | Live third-party LLM adapter (OpenAI / Anthropic / Gemini) | `backend/src/ai/index.ts` is a 3-line boundary placeholder. Zero live external API calls exist | **DEFERRED / ZERO-BUDGET** | `backend/src/ai/index.ts` |
| **Ranking & Leaderboards** | 5-component deterministic Hiresense Competency Score | Full `ScoreEngine` (Mastery 40%, Difficulty 20%, Coverage 15%, Projects 15%, Interviews 10%) | **COMPLETE** | `backend/src/ranking/scoreEngine.ts`, `backend/src/ranking/rankingService.ts` |
| **Resume Extraction** | Upload resume, parse text, extract skills as unverified | Base64/plain-text sanitizer, section segmenter, taxonomy matcher; stamps `UNVERIFIED` | **BACKEND COMPLETE / UI GAP** | `backend/src/resume/resumeExtractor.ts`, `skillExtractor.ts`; frontend views missing |
| **Domain Diagnostics** | Cross-domain multi-skill rapid assessment | Diagnostic generator, isolated multi-skill evaluation with automatic proof creation | **BACKEND COMPLETE / UI GAP** | `backend/src/assessment/diagnosticService.ts`; frontend views missing |
| **User Profile UI** | Dedicated Profile edit view in frontend shell | `ProfileView.tsx` exists in `components/profile/` but is not mounted in `App.tsx` | **DISCONNECTED** | `frontend/src/components/profile/ProfileView.tsx` |

---

## 4. Complete Repository Directory Map

```text
Hiresence_AI/
├── .agents/                        # ECC Agent rules, instincts, and workflows
├── CLAUDE.md                       # Master coding instructions & core invariants
├── README.md                       # Project landing overview
├── database/                       # Database migrations and baseline SQL seeds
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # 15 relational tables, constraints, indexes
│   ├── seeds/
│   │   └── 001_initial_seeds.sql   # Initial domains, foundation skills, dependencies
│   └── README.md
├── backend/                        # Express.js REST API Modular Monolith
│   ├── .env.example                # Port, Supabase URL, Anon Key, Service Role Key
│   ├── package.json                # Dependencies: @supabase/supabase-js, cors, dotenv, express
│   ├── tsconfig.json               # ES2022 / NodeNext TypeScript config
│   └── src/
│       ├── index.ts                # App entry point, middleware, routes mounting, health check
│       ├── ai/                     # Boundary placeholder (Phase 3 Unit 23)
│       ├── auth/                   # JWT Bearer authentication middleware & routes
│       ├── users/                  # User profile service & routes
│       ├── roadmap/                # StandardRoadmapAdapter, graph models, domain seeds
│       ├── skills/                 # Skill progression, state engine, verified profile
│       ├── resources/              # Learning resources catalog per skill
│       ├── assessment/             # Question banks, test attempts, integrity, diagnostics
│       ├── portfolio/              # SHA-256 cryptographic proofs, badge SVG generator
│       ├── career/                 # Job posting ingestion, skill extraction, gap engine
│       ├── interview/              # Question bank, session manager, rubric evaluator, STAR
│       ├── ranking/                # 5-factor ScoreEngine, leaderboard, distributions
│       ├── resume/                 # Text extraction, section segmenter, taxonomy claims
│       ├── projects/               # Boundary placeholder for project recommendations
│       └── common/                 # Supabase client factory, shared error types
├── frontend/                       # React 18 + Vite 5 + TypeScript + Tailwind CSS
│   ├── .env.example                # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
│   ├── package.json                # Dependencies: react, react-dom, lucide-react, tailwindcss
│   ├── vite.config.ts              # Vite dev server configuration
│   ├── tailwind.config.js          # Dark workspace color theme tokens
│   └── src/
│       ├── main.tsx                # React DOM root entry
│       ├── App.tsx                 # Master application shell, sidebar navigation, view switcher
│       ├── index.css               # Semantic CSS variables & dark workspace palette
│       ├── context/                # AuthContext (token storage, login, logout, mock bypass)
│       ├── types/                  # Shared frontend DTO interfaces (roadmap, ranking, etc.)
│       ├── lib/                    # Typed API client SDKs (roadmap, assessment, career, ranking, etc.)
│       └── components/
│           ├── auth/               # AuthModal (Sign In, Register, Demo Bypass)
│           ├── profile/            # ProfileView (Disconnected from main nav)
│           ├── roadmap/            # RoadmapView, DomainSelector, SkillNodeCard, SkillDetailModal
│           ├── visualizer/         # SkillGraphCanvas, layoutEngine, traversalEngine, MiniMap, Controls
│           ├── assessment/         # TimedAssessmentModal, AssessmentResultView, useAssessmentIntegrity
│           ├── portfolio/          # PortfolioView, VerificationProofCard, ProofCardModal, PublicVerification
│           ├── career/             # JobAnalyzerView (Job posting selector, raw paste, gap visualization)
│           ├── interview/          # MockInterviewView (Session manager, question wizard, STAR evaluation)
│           └── ranking/            # LeaderboardView, ScoreOverviewCard, LeaderboardTable, Analytics
└── context/                        # Technical specifications and build tracking
    ├── project-overview.md         # Problem statement, goals, scope, and user flow
    ├── architecture.md             # Stack, boundaries, invariants, ranking formulas
    ├── ui-context.md               # Theme, tokens, layout standards, dark workspace
    ├── code-standards.md           # Engineering guidelines, file structure, naming
    ├── ai-workflow-rules.md        # Spec-driven development rules
    ├── progress-tracker.md         # Detailed progress logs through Phase 8
    ├── current-project-state.json  # Machine-readable forensic audit state
    ├── AI-PROJECT-CONTEXT.md       # (This file) Master system knowledge base
    ├── AI-REPORT-CONTEXT.md        # Academic report, documentation & viva guide
    └── specs/                      # 50 Detailed Implementation Specifications (00 to 49)
```

---

## 5. Technology Stack

| Layer | Technology | Version | Purpose in Hiresense_AI |
|---|---|---|---|
| **Runtime** | Node.js | v20+ | Backend execution runtime |
| **Backend Framework** | Express.js | 4.19.2 | Modular REST API routing, controllers, and JSON serialization |
| **Backend Transpiler** | tsx | 4.7.2 | Instant TypeScript execution in watch/dev mode |
| **Language (Backend)** | TypeScript | 5.4.5 | Type safety, strict interfaces, domain DTO definitions |
| **Frontend Framework** | React | 18.3.1 | Component-based interactive user interface |
| **Frontend Bundler** | Vite | 5.2.10 | Fast HMR dev server and optimized production bundling |
| **Language (Frontend)** | TypeScript | 5.4.5 | Strict client-side contract typing |
| **Styling** | Tailwind CSS | 3.4.3 | Utility-first styling with custom CSS custom property tokens |
| **Icons** | Lucide React | 0.378.0 | Consistent, modern developer workspace iconography |
| **Database** | PostgreSQL | 15+ | Relational persistence of users, skills, questions, attempts |
| **BaaS Provider** | Supabase | 2.43.4 | Managed PostgreSQL, Row Level Security, and JWT Authentication |
| **Cryptography** | Node.js `crypto` | Built-in | SHA-256 HMAC proof generation, UUID generation, random bytes |
| **Version Control** | Git | 2.40+ | Distributed version control and commit history tracking |

---

## 6. Detailed Backend Architecture

The backend operates as a **modular monolith**. Each functional domain is strictly isolated inside its own folder under `backend/src/` with its own `types.ts`, `service.ts`, `routes.ts`, and `index.ts`.

### 6.1 Dual-Mode Resilience Pattern
Every service implements dual-mode persistence:
1. **Configured Supabase Mode**: If `SUPABASE_URL` and `SUPABASE_ANON_KEY` are present and valid, database queries are dispatched via `@supabase/supabase-js`.
2. **In-Memory Fallback Mode**: If Supabase credentials are empty, invalid, or throw a connection error, the service automatically falls back to an internal TypeScript `Map<string, T>` initialized with authentic seed datasets. The system never crashes due to a disconnected database.

### 6.2 Domain Module Breakdown
1. **`auth`**: Validates incoming `Authorization: Bearer <token>` headers. In development mode, supports token `mock-dev-token` which maps directly to mock candidate `00000000-0000-0000-0000-000000000001`.
2. **`users`**: Manages candidate profile attributes (display name, institution, career goal, GitHub URL, LinkedIn URL).
3. **`roadmap`**: Contains `StandardRoadmapAdapter` and `RoadmapService`. Pre-seeds 3 core tracks:
   - `backend-developer` (9 skills: Internet Basics, OS/CLI, Programming Languages, Relational DBs, Version Control, REST APIs, Auth & Security, Caching, System Design)
   - `frontend-developer` (9 skills: Internet Basics, HTML & CSS, JavaScript, Version Control, React, CSS Frameworks, State Management, Frontend Testing, Web Performance)
   - `ai-data-engineer` (9 skills: Math/Stats, Python, DSA, Pandas, SQL & Data Warehousing, ML Fundamentals, Deep Learning, ETL Pipelines, MLOps)
4. **`skills`**: Evaluates individual skill states for candidates. Resolves prerequisite chains to assign one of: `LOCKED`, `AVAILABLE`, `IN_PROGRESS`, or `VERIFIED`. Aggregates the Verified Skill Profile.
5. **`resources`**: Serves curated learning resources (documentation links, articles, official guides) for each roadmap node.
6. **`assessment`**: Houses question banks, timed test lifecycle, 80% passing verification engine, 3 attempts/month limit enforcement, domain diagnostics, and anti-cheating integrity checks.
7. **`portfolio`**: Implements `ProofService` and `PortfolioService`. Produces immutable SHA-256 HMAC verification signatures, generates standalone SVG badges, and exposes public recruiter verification endpoints.
8. **`career`**: Manages benchmark job postings, accepts pasted job descriptions, extracts skills using regex taxonomy matching, and computes weighted compatibility and skill gap matrices.
9. **`interview`**: Pre-seeds 20+ comprehensive interview questions across technical domains and behavioral STAR questions. Evaluates candidate answers against rubrics, signals, anti-patterns, and response length.
10. **`ranking`**: Implements `ScoreEngine` (5-factor formula) and `RankingService`. Pre-seeds benchmark candidates across elite institutions (IIT Madras, Stanford, MIT, Oxford, Anna University, UC Berkeley) and provides multi-scope leaderboard filtering.
11. **`resume`**: Sanitizes PDF/Text streams, segments contact, education, experience, and projects, matches skills against Hiresense taxonomy, and imports claims strictly as `UNVERIFIED`.
12. **`projects` & `ai`**: Clean modular placeholders reserved for future standalone recommendation and LLM integrations.

---

## 7. Complete API Endpoint Catalog

The backend exposes **48 fully operational REST endpoints** across 11 routers mounted in `backend/src/index.ts`:

### 7.1 Health & Auth (`/api/health`, `/api/auth`)
| Method | Endpoint | Auth Required | Request Payload | Response Data | Purpose |
|---|---|---|---|---|---|
| `GET` | `/api/health` | No | None | `{ status, name, timestamp, environment, supabaseConfigured }` | System health check and Supabase status |
| `GET` | `/api/auth/me` | Yes (Bearer) | None | `{ success, data: { user: { id, email } } }` | Retrieve current authenticated user context |

### 7.2 User Profile (`/api/users`)
| Method | Endpoint | Auth Required | Request Payload | Response Data | Purpose |
|---|---|---|---|---|---|
| `GET` | `/api/users/profile` | Yes (Bearer) | None | `{ success, data: { profile } }` | Get candidate profile attributes |
| `PUT` | `/api/users/profile` | Yes (Bearer) | `{ displayName?, institution?, careerGoal?, githubUrl?, linkedinUrl? }` | `{ success, data: { profile } }` | Update candidate profile attributes |

### 7.3 Roadmaps & Skills (`/api/roadmap`, `/api/skills`, `/api/resources`)
| Method | Endpoint | Auth Required | Request Payload | Response Data | Purpose |
|---|---|---|---|---|---|
| `GET` | `/api/roadmap/domains` | No | None | `{ success, data: { domains: DomainDTO[] } }` | List all available learning tracks |
| `GET` | `/api/roadmap/:domainSlug` | No | None | `{ success, data: { domain, roadmap, nodes } }` | Retrieve raw public roadmap DAG graph |
| `GET` | `/api/skills/roadmap/:domainSlug` | Yes (Bearer) | None | `{ success, data: UserRoadmapStateDTO }` | Get personalized roadmap with computed `LOCKED`/`AVAILABLE`/`VERIFIED` states |
| `GET` | `/api/skills/my-skills` | Yes (Bearer) | None | `{ success, data: { skills: UserSkillDTO[] } }` | Get all candidate skill records |
| `POST` | `/api/skills/claim` | Yes (Bearer) | `{ skillId }` | `{ success, data: { userSkill } }` | Declare a self-claim (creates `CLAIMED`, never verified) |
| `GET` | `/api/skills/verified-profile` | Yes (Bearer) | None | `{ success, data: VerifiedSkillProfileDTO }` | Aggregated profile of only verified skills ($\ge 80\%$) |
| `GET` | `/api/resources/:skillSlug` | No | None | `{ success, data: { resources: ResourceDTO[] } }` | Fetch curated learning links for a skill |

### 7.4 Assessments & Integrity (`/api/assessment`)
| Method | Endpoint | Auth Required | Request Payload | Response Data | Purpose |
|---|---|---|---|---|---|
| `POST` | `/api/assessment/start` | Yes (Bearer) | `{ skillId, questionCount? }` | `{ success, data: { attempt, questions } }` | Start timed test (randomized questions, answers stripped) |
| `GET` | `/api/assessment/attempt/:attemptId` | Yes (Bearer) | None | `{ success, data: { attempt, questions } }` | Poll active attempt state |
| `POST` | `/api/assessment/submit` | Yes (Bearer) | `{ attemptId, answers: [{ questionId, selectedOptionIndex }], integrityReport? }` | `{ success, data: EvaluationResultDTO }` | Authoritative scoring, integrity verification, proof generation |
| `GET` | `/api/assessment/history` | Yes (Bearer) | Query `?skillId=` | `{ success, data: { attempts: TestAttemptDTO[] } }` | Candidate assessment history |
| `GET` | `/api/assessment/attempts-status/:skillId` | Yes (Bearer) | None | `{ success, data: SkillAttemptStatusDTO }` | Monthly attempt limit usage (X of 3), days until reset |
| `POST` | `/api/assessment/diagnostic/generate` | No | `{ domainSlug, userId?, targetSkillIds? }` | `{ success, data: DomainDiagnosticDTO }` | Generate multi-skill diagnostic assessment |
| `GET` | `/api/assessment/diagnostic/:diagnosticId` | No | None | `{ success, data: DomainDiagnosticDTO }` | Fetch active public diagnostic session |
| `POST` | `/api/assessment/diagnostic/submit` | No | `{ diagnosticId, userId?, answers }` | `{ success, data: DiagnosticEvaluationDTO }` | Multi-skill isolated evaluation & auto proof creation |

### 7.5 Verification Portfolio & Proofs (`/api/portfolio`)
| Method | Endpoint | Auth Required | Request Payload | Response Data | Purpose |
|---|---|---|---|---|---|
| `GET` | `/api/portfolio/me` | Yes (Bearer) | None | `{ success, data: { portfolio: CandidatePortfolioDTO } }` | Candidate's compiled portfolio and proofs |
| `GET` | `/api/portfolio/verify/:proofId` | No | None | `{ success, data: { proofCard: PublicProofCardDTO } }` | Public recruiter verification of SHA-256 proof |
| `GET` | `/api/portfolio/badge/:proofId` | No | None | Standalone SVG XML | Dynamic SVG verification badge embedding |
| `GET` | `/api/portfolio/id/:userId` | No | None | `{ success, data: { portfolio } }` | Public candidate portfolio by user ID |
| `GET` | `/api/portfolio/:username` | No | None | `{ success, data: { portfolio } }` | Public candidate portfolio by username |

### 7.6 Career & Job Analyzer (`/api/career`)
| Method | Endpoint | Auth Required | Request Payload | Response Data | Purpose |
|---|---|---|---|---|---|
| `GET` | `/api/career/jobs` | No | None | `{ success, data: { jobs: JobPostingDTO[] } }` | List benchmark job postings |
| `GET` | `/api/career/jobs/:jobId` | No | None | `{ success, data: { job: JobPostingDTO } }` | Get single job details and requirements |
| `POST` | `/api/career/jobs` | No | `{ title, company, location?, employmentType?, rawDescription, domainSlug? }` | `{ success, data: { job: JobPostingDTO } }` | Ingest and persist structured job posting |
| `POST` | `/api/career/parse` | No | `{ rawDescription, domainSlug? }` | `{ success, data: ExtractedSkillsResult }` | Extract required/preferred skills from text on the fly |
| `POST` | `/api/career/match/:jobId` | No (uses header fallback) | None | `{ success, data: CareerGapAnalysisDTO }` | Deterministic compatibility & skill gap analysis |
| `POST` | `/api/career/match-text` | No (uses header fallback) | `{ rawDescription, domainSlug? }` | `{ success, data: CareerGapAnalysisDTO }` | Match against raw pasted job text on the fly |

### 7.7 Mock Interview Engine (`/api/interview`)
| Method | Endpoint | Auth Required | Request Payload | Response Data | Purpose |
|---|---|---|---|---|---|
| `GET` | `/api/interview/questions` | No | Query `?domainSlug=&type=&difficulty=&skillId=` | `{ success, data: { questions: InterviewQuestionDTO[] } }` | Query question bank and rubrics |
| `GET` | `/api/interview/questions/:questionId` | No | None | `{ success, data: { question: InterviewQuestionDTO } }` | Single question details and scoring criteria |
| `POST` | `/api/interview/sessions` | No (uses header fallback) | `{ domainSlug, targetJobTitle?, questionCount?, difficulty?, includeBehavioral? }` | `{ success, data: { session: InterviewSessionDTO } }` | Create staged mock interview session |
| `GET` | `/api/interview/sessions` | No (uses header fallback) | None | `{ success, data: { sessions: InterviewSessionDTO[] } }` | List candidate's interview sessions |
| `GET` | `/api/interview/sessions/:sessionId` | No | None | `{ success, data: { session: InterviewSessionDTO } }` | Retrieve session questions and answer state |
| `POST` | `/api/interview/sessions/:sessionId/answer` | No | `{ questionId, responseText }` | `{ success, data: { session } }` | Submit candidate response to question |
| `POST` | `/api/interview/sessions/:sessionId/skip` | No | `{ questionId }` | `{ success, data: { session } }` | Skip staged interview question |
| `POST` | `/api/interview/sessions/:sessionId/abandon` | No | None | `{ success, data: { session } }` | Cancel active session |
| `POST` | `/api/interview/sessions/:sessionId/evaluate` | No | None | `{ success, data: { evaluation: SessionEvaluationDTO } }` | Generate complete rubric & STAR evaluation |
| `POST` | `/api/interview/evaluate-answer` | No | `{ questionId, responseText }` | `{ success, data: { evaluation: QuestionEvaluationDTO } }` | Directly evaluate single answer on the fly |

### 7.8 Ranking & Leaderboards (`/api/ranking`)
| Method | Endpoint | Auth Required | Request Payload | Response Data | Purpose |
|---|---|---|---|---|---|
| `GET` | `/api/ranking/my-score` | Yes (Bearer) | None | `{ success, data: UserCompetencyScoreDTO }` | Current user's 5-factor competency breakdown |
| `GET` | `/api/ranking/score/:userId` | No | None | `{ success, data: UserCompetencyScoreDTO }` | Candidate competency score and tier |
| `GET` | `/api/ranking/leaderboard` | No | Query `?scope=global\|domain\|institution&domainSlug=&institution=&tier=&search=` | `{ success, data: LeaderboardResponseDTO }` | Multi-scope ranked leaderboard |
| `GET` | `/api/ranking/distribution` | No | None | `{ success, data: ScoreDistributionDTO }` | Global tier statistics and top institutions |

### 7.9 Resume Ingestion (`/api/resume`)
| Method | Endpoint | Auth Required | Request Payload | Response Data | Purpose |
|---|---|---|---|---|---|
| `POST` | `/api/resume/extract-text` | No | `{ rawText?, fileBase64?, mimeType? }` | `{ success, data: ResumeExtractionResult }` | Sanitize and segment resume sections |
| `POST` | `/api/resume/parse-raw` | No | `{ text }` | `{ success, data: ResumeExtractionResult }` | Convenience parser for pasted raw text |
| `POST` | `/api/resume/extract-skills` | No | `{ rawText?, fileBase64?, sections? }` | `{ success, data: ResumeSkillExtractionResult }` | Extract taxonomy skills stamped `UNVERIFIED` |
| `POST` | `/api/resume/import-claims` | No | `{ userId, claims: [] }` | `{ success, data: { importedCount, claims, invariantNotice } }` | Stamped import of unverified self-claims |

---

## 8. Database Architecture & Schema Specification

The PostgreSQL relational schema is defined in `database/migrations/001_initial_schema.sql`.

### 8.1 Complete Entity Table Catalog
```
                    ┌─────────────────┐
                    │   auth.users    │
                    └────────┬────────┘
                             │ 1:1
                    ┌────────▼────────┐
                    │    profiles     │
                    └────────┬────────┘
                             │
       ┌─────────────────────┼──────────────────────┬──────────────────────┐
       │ 1:N                 │ 1:N                  │ 1:N                  │ 1:N
┌──────▼──────┐       ┌──────▼──────┐        ┌──────▼──────┐        ┌──────▼──────┐
│ user_skills │       │test_attempts│        │job_analyses │        │interview_   │
└──────┬──────┘       └──────┬──────┘        └──────┬──────┘        │  sessions   │
       │ N:1                 │ N:1                  │ 1:N           └──────┬──────┘
┌──────▼──────┐       ┌──────▼──────┐        ┌──────▼──────┐               │ 1:N
│   skills    │◄──────┤    tests    │        │    job_     │        ┌──────▼──────┐
└──────▲──────┘       └─────────────┘        │requirements │        │ interview_  │
       │                                     └─────────────┘        │  questions  │
       │ N:M self-reference via                                     └──────┬──────┘
       │ skill_dependencies                                                │ 1:1
       │                                                            ┌──────▼──────┐
┌──────┴──────┐                                                     │ interview_  │
│question_    │◄────────────────────────────────────────────────────┤   answers   │
│   banks     │                                                     └─────────────┘
└──────┬──────┘
       │ 1:N
┌──────▼──────┐
│  questions  │
└─────────────┘
```

#### Table 1: `profiles`
- **Purpose**: Stores candidate biographical and academic attributes linked directly to Supabase authentication.
- **Columns**: `id UUID PK REFERENCES auth.users(id) ON DELETE CASCADE`, `email TEXT NOT NULL UNIQUE`, `display_name TEXT NOT NULL`, `role TEXT NOT NULL CHECK (role IN ('student', 'professional', 'admin'))`, `institution TEXT`, `career_goal TEXT`, `github_url TEXT`, `linkedin_url TEXT`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.

#### Table 2: `domains`
- **Purpose**: High-level engineering disciplines/tracks.
- **Columns**: `id UUID PK DEFAULT uuid_generate_v4()`, `slug TEXT NOT NULL UNIQUE`, `name TEXT NOT NULL`, `description TEXT`, `created_at TIMESTAMPTZ`.

#### Table 3: `roadmaps`
- **Purpose**: Specific versioned curriculum blueprints for a domain.
- **Columns**: `id UUID PK`, `domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE`, `title TEXT NOT NULL`, `version TEXT NOT NULL`, `description TEXT`, `created_at TIMESTAMPTZ`.

#### Table 4: `skills`
- **Purpose**: Atomic engineering competencies that can be studied and verified.
- **Columns**: `id UUID PK`, `slug TEXT NOT NULL UNIQUE`, `name TEXT NOT NULL`, `description TEXT`, `category TEXT NOT NULL`, `difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'))`, `created_at TIMESTAMPTZ`.

#### Table 5: `skill_dependencies`
- **Purpose**: Graph edges enforcing prerequisite relationships between skills.
- **Columns**: `id UUID PK`, `skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE`, `prerequisite_skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE`, `created_at TIMESTAMPTZ`.
- **Constraints**: `UNIQUE (skill_id, prerequisite_skill_id)`.

#### Table 6: `user_skills`
- **Purpose**: Central entity recording candidate claim and verification state.
- **Columns**: `id UUID PK`, `user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE`, `skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE`, `status TEXT NOT NULL DEFAULT 'CLAIMED' CHECK (status IN ('CLAIMED', 'UNVERIFIED', 'VERIFIED'))`, `verification_score NUMERIC(5,2)`, `verification_date TIMESTAMPTZ`, `attempt_count INT DEFAULT 0`, `last_attempt_at TIMESTAMPTZ`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`.
- **Constraints**: `UNIQUE (user_id, skill_id)`.

#### Table 7: `question_banks`
- **Purpose**: Skill-specific container for assessment question pools.
- **Columns**: `id UUID PK`, `skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE`, `title TEXT NOT NULL`, `created_at TIMESTAMPTZ`.

#### Table 8: `questions`
- **Purpose**: Multiple-choice assessment questions.
- **Columns**: `id UUID PK`, `question_bank_id UUID NOT NULL REFERENCES question_banks(id) ON DELETE CASCADE`, `question_text TEXT NOT NULL`, `options JSONB NOT NULL`, `correct_option_index INT NOT NULL`, `explanation TEXT`, `difficulty TEXT NOT NULL`, `created_at TIMESTAMPTZ`.

#### Table 9: `tests`
- **Purpose**: Assessment configuration parameters for a skill.
- **Columns**: `id UUID PK`, `skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE`, `title TEXT NOT NULL`, `time_limit_minutes INT DEFAULT 15`, `passing_score NUMERIC(5,2) DEFAULT 80.00`, `created_at TIMESTAMPTZ`.

#### Table 10: `test_attempts`
- **Purpose**: Immutable audit log of every assessment attempt.
- **Columns**: `id UUID PK`, `test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE`, `user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE`, `score NUMERIC(5,2) NOT NULL`, `passed BOOLEAN NOT NULL DEFAULT FALSE`, `started_at TIMESTAMPTZ`, `completed_at TIMESTAMPTZ`.

#### Table 11: `job_analyses`
- **Purpose**: Stored job description comparison runs.
- **Columns**: `id UUID PK`, `user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE`, `job_title TEXT NOT NULL`, `job_description TEXT NOT NULL`, `compatibility_score NUMERIC(5,2) DEFAULT 0.00`, `created_at TIMESTAMPTZ`.

#### Table 12: `job_requirements`
- **Purpose**: Individual skills extracted from a job description.
- **Columns**: `id UUID PK`, `job_analysis_id UUID NOT NULL REFERENCES job_analyses(id) ON DELETE CASCADE`, `skill_name TEXT NOT NULL`, `normalized_skill_id UUID REFERENCES skills(id) ON DELETE SET NULL`, `is_matched BOOLEAN DEFAULT FALSE`, `created_at TIMESTAMPTZ`.

#### Table 13: `interview_sessions`
- **Purpose**: Staged mock interview session container.
- **Columns**: `id UUID PK`, `user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE`, `job_analysis_id UUID REFERENCES job_analyses(id) ON DELETE SET NULL`, `status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED'))`, `overall_score NUMERIC(5,2)`, `feedback TEXT`, `created_at TIMESTAMPTZ`.

#### Table 14: `interview_questions`
- **Purpose**: Questions presented during an interview session.
- **Columns**: `id UUID PK`, `session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE`, `question_order INT NOT NULL`, `question_text TEXT NOT NULL`, `created_at TIMESTAMPTZ`.

#### Table 15: `interview_answers`
- **Purpose**: Candidate answers and structured evaluation payloads.
- **Columns**: `id UUID PK`, `question_id UUID NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE`, `user_answer TEXT NOT NULL`, `evaluation JSONB`, `score NUMERIC(5,2)`, `created_at TIMESTAMPTZ`.

---

## 9. Mathematical Formulations & Core Algorithms

### 9.1 Hiresense Competency Score Formula (5-Factor Normalized)
Implemented in `backend/src/ranking/scoreEngine.ts`:
$$S_{\text{composite}} = 0.40 \times S_{\text{mastery}} + 0.20 \times S_{\text{difficulty}} + 0.15 \times S_{\text{coverage}} + 0.15 \times S_{\text{project}} + 0.10 \times S_{\text{interview}}$$

Where:
1. **$S_{\text{mastery}}$** (Skill Mastery, 40%): Average percentage score across all verified skill assessments ($\ge 80\%$). If no verified skills, defaults to baseline 70.0.
2. **$S_{\text{difficulty}}$** (Skill Difficulty, 20%): Difficulty-weighted mastery normalized to 100:
   $$S_{\text{difficulty}} = \frac{\sum_{i \in \text{Verified}} (\text{score}_i \times W_{\text{diff}}(i))}{\sum_{i \in \text{Verified}} W_{\text{diff}}(i)} \times \frac{1}{2.0} \times 100$$
   With weights: $W_{\text{beginner}} = 1.0$, $W_{\text{intermediate}} = 1.5$, $W_{\text{advanced}} = 2.0$.
3. **$S_{\text{coverage}}$** (Domain Curriculum Coverage, 15%):
   $$S_{\text{coverage}} = \min\left(100, \frac{|\text{Verified Skills in Domain}|}{|\text{Total Skills in Domain}|} \times 100\right)$$
4. **$S_{\text{project}}$** (Project Completion / Quality, 15%):
   $$S_{\text{project}} = \min(100, 65 + (\text{Completed Projects} \times 10))$$
5. **$S_{\text{interview}}$** (Interview Performance, 10%): Average score across all evaluated mock interview sessions. If none taken, fallback default is 60.0.

#### Competency Tier Classification
- $S_{\text{composite}} \ge 90.0 \implies \mathbf{MASTER}$
- $75.0 \le S_{\text{composite}} < 90.0 \implies \mathbf{EXPERT}$
- $60.0 \le S_{\text{composite}} < 75.0 \implies \mathbf{PROFICIENT}$
- $40.0 \le S_{\text{composite}} < 60.0 \implies \mathbf{APPRENTICE}$
- $S_{\text{composite}} < 40.0 \implies \mathbf{NOVICE}$

---

### 9.2 Assessment Scoring & Integrity Signals Engine
Implemented in `backend/src/assessment/testService.ts` and `frontend/src/components/assessment/useAssessmentIntegrity.ts`:

1. **Academic Test Score**:
   $$\text{Academic Score} = \frac{\text{Number of Correct Answers}}{\text{Total Questions}} \times 100$$
   **Passing Condition**: $\text{Academic Score} \ge 80.0\%$.

2. **Integrity Score Deduction Model**:
   $$\text{Penalty} = (10 \times N_{\text{tab\_switch}}) + (15 \times N_{\text{fullscreen\_exit}}) + (5 \times N_{\text{clipboard\_violation}})$$
   $$\text{Integrity Score} = \max(0, 100 - \text{Penalty})$$

3. **Disqualification Invariant**:
   An attempt is flagged and disqualified (`passed = false`) if:
   $$N_{\text{tab\_switch}} > 3 \quad \lor \quad \text{Integrity Score} < 60.0$$
   Disqualified attempts **never** update `user_skills` to `VERIFIED` and **never** receive a cryptographic proof artifact.

---

### 9.3 Cryptographic Proof Generation (SHA-256 HMAC)
Implemented in `backend/src/portfolio/proofService.ts`:
- **Proof Payload**:
  $$\text{Payload} = \text{userId} \parallel \text{skillId} \parallel \text{score} \parallel \text{attemptId} \parallel \text{verificationDate}$$
- **Verification Hash**:
  $$\text{Hash} = \text{HMAC-SHA256}(\text{Payload}, K_{\text{secret}})$$
- **Proof Identifier**:
  $$\text{Proof ID} = \text{"PRF-"} \parallel \text{CleanSlug}(\text{skillId}) \parallel \text{"-"} \parallel \text{RandomHex}(3)$$
  *(Example: `PRF-NODEJS-8F29A`)*

---

### 9.4 Job Compatibility & Weighted Gap Analysis
Implemented in `backend/src/career/jobMatchEngine.ts` and `jobGapEngine.ts`:
- Required skills have weight $W_{\text{req}} = 1.0$.
- Preferred skills have weight $W_{\text{pref}} = 0.5$.
$$\text{Compatibility Score} = \frac{\sum_{s \in \text{Verified} \cap \text{Job}} W(s)}{\sum_{s \in \text{Job}} W(s)} \times 100$$

Gap Classification:
- **`MATCHED`**: $s \in \text{Verified Skills}$
- **`MISSING_CRITICAL`**: $s \in \text{Required Skills} \setminus \text{Verified Skills}$
- **`MISSING_OPTIONAL`**: $s \in \text{Preferred Skills} \setminus \text{Verified Skills}$
- **`CLAIMED_UNVERIFIED`**: $s \in \text{Claimed/Resume Skills} \setminus \text{Verified Skills}$

---

### 9.5 Directed Acyclic Graph (DAG) Traversal & Layout
Implemented in `frontend/src/components/visualizer/layoutEngine.ts` and `traversalEngine.ts`:
1. **Cycle Detection**: Depth-First Search (DFS) with 3-color vertex marking (`WHITE`, `GRAY`, `BLACK`). Ensures curriculum graphs never enter deadlocks.
2. **Prerequisite Ancestor Traversal**: Breadth-First Search (BFS) climbing upstream dependencies to highlight the critical learning path.
3. **Downstream Unlock Cascade**: BFS discovering all future skills that become unlockable upon verifying a node.
4. **Curriculum Goal Pathfinding**: Dijkstra-based shortest-path traversal finding the minimum required prerequisites between currently verified roots and a target goal skill.
5. **Deterministic Hierarchical Layout**: Sugiyama-style rank assignment mapping nodes to integer tiers $L_0, L_1, \dots, L_k$, sorting siblings by barycenter to minimize edge crossings, and drawing smooth cubic Bezier links:
   $$B(t) = (1-t)^3 P_0 + 3(1-t)^2 t P_1 + 3(1-t) t^2 P_2 + t^3 P_3, \quad t \in [0, 1]$$

---

## 10. AI System Realities & Boundaries

### 10.1 Deterministic & Heuristic AI Implementation
In strict compliance with the **zero-budget constraint**, Hiresense_AI does not call paid third-party LLMs (such as OpenAI GPT-4, Anthropic Claude, or Google Gemini). Instead, all "AI" capabilities are implemented through **deterministic expert systems, natural language taxonomy tokenizers, and rubric-driven heuristic evaluators**:

1. **Resume Skill Extraction (`ResumeSkillExtractor`)**:
   - Multi-pass taxonomy keyword & alias match engine.
   - Normalizes text, strips script tags and control characters, segments headings (`EXPERIENCE`, `EDUCATION`, `SKILLS`, `PROJECTS`), and matches tokens against a 100+ entry canonical engineering taxonomy.
2. **Job Description Requirement Extraction (`JobExtractorService`)**:
   - Parses raw unstructured job postings. Detects section cues (`Required:`, `Must have:`, `Nice to have:`, `Bonus:`).
   - Maps keywords to canonical skill slugs with alias resolution (e.g., `postgres` $\to$ `postgresql-relational-db`).
3. **Interview Response Evaluation (`InterviewEvaluatorService`)**:
   - Evaluates candidate text responses against pre-seeded questions containing 3 rubric dimensions: `keySignals`, `antiPatterns`, and `idealAnswerOutline`.
   - Checks signal presence using stop-word stripping and 35% keyword stem presence.
   - Deducts penalties for anti-patterns and awards depth bonuses for comprehensive technical articulation ($\ge 60$ or $\ge 100$ words).
   - Evaluates behavioral answers against the STAR method (Situation, Task, Action, Result) in `starFeedbackFormatterService.ts`.

### 10.2 Strict System Invariants on AI
1. **AI Output is Untrusted**: AI-extracted resume skills are strictly stamped as `UNVERIFIED` self-claims with `verificationScore = null`.
2. **AI Never Verifies Skills**: An AI model cannot grant verification or bypass the 80.0% assessment requirement.
3. **AI Never Controls Security**: Authentication, authorization, attempt limits, database mutations, and ranking weights are 100% deterministic code.

---

## 11. State Machine Specifications

### 11.1 Skill Lifecycle State Machine
```text
           [Prerequisites Unmet]
                     │
                     ▼
                 ┌────────┐
                 │ LOCKED │
                 └───┬────┘
                     │ All prerequisites achieve status: 'VERIFIED'
                     ▼
                ┌───────────┐
       ┌───────►│ AVAILABLE │◄────────┐
       │        └─────┬─────┘         │
       │              │               │
       │ Learner      │ Learner       │ Failed Assessment
       │ clicks Claim │ starts Test   │ (Score < 80%)
       │              ▼               │
       │       ┌─────────────┐        │
       │       │ IN_PROGRESS ├────────┘
       │       └──────┬──────┘
       │              │ Passed Assessment (Score >= 80% & Integrity Clean)
       │              ▼
       │        ┌──────────┐
       └────────┤ VERIFIED │
                └──────────┘
```

### 11.2 Assessment Attempt Lifecycle
```text
[Click Start Test] ──► INITIATED (Random questions picked, time limit set)
                              │
                              ▼
                         IN_PROGRESS (Timer running, integrity hook active)
                              │
               ┌──────────────┴──────────────┐
               │ Submit or Time Expires      │ Disqualified
               ▼                             ▼
           COMPLETED                      FLAGGED
    (Score computed >= 80%?)        (Tab switches > 3 or Integrity < 60)
         /         \                         │
       YES          NO                       │
        │            │                       ▼
   [VERIFIED]   [UNVERIFIED]            [DISQUALIFIED]
   (Proof Issued) (Attempts -1)         (No Proof, Disqualified)
```

---

## 12. Forensic Project Status & Completion Inventory

### 12.1 Module-by-Module Verification Status

| Phase | Module | Implemented Features | Forensic Status |
|---|---|---|---|
| **Phase 0** | Foundation & Auth | Skeleton, Supabase connection, Auth middleware, Profile API, Auth UI Modal | **COMPLETE** |
| **Phase 1** | Roadmap Engine | Internal schema, Adapter, Seed tracks, Read API, Roadmap UI, Skill State Engine | **COMPLETE** |
| **Phase 2** | Assessment Engine | Question banks, Test attempt schema, Selection service, Timed UI, Scoring, Attempt Limits | **COMPLETE** |
| **Phase 3** | Verification Portfolio | Cryptographic SHA-256 HMAC proofs, Portfolio persistence, Public API, Verification UI, SVG Badge | **COMPLETE** |
| **Phase 4** | Job Analyzer Engine | Benchmark jobs, Keyword extraction, Match engine, Gap engine, Job Match & Gap UI | **COMPLETE** |
| **Phase 5** | Mock Interview Engine | Question bank & rubrics, Session engine, Rubric evaluator, STAR formatter, Mock Interview UI | **COMPLETE** |
| **Phase 6** | Skill Graph Visualizer | DAG Canvas viewport, Layout engine (Sugiyama/Bezier), Traversal engine, Profile HUD, MiniMap | **COMPLETE** |
| **Phase 7** | Ranking & Leaderboards | ScoreEngine (5 components), RankingService, Leaderboard API, Leaderboard UI, Analytics | **COMPLETE** |
| **Phase 8** | Advanced Ingestion | Resume text extractor, Resume skill extractor, Domain diagnostic engine, Integrity signals hook | **PARTIAL** (Backend & Tests Complete; UI Missing) |
| **Phase 9** | Hardening & Freeze | End-to-end integration, security audit pass, final presentation freeze | **PLANNED** |

### 12.2 What was Completed Before Development Stopped?
Development paused immediately following **commit `0bfaae0`** on **September 11, 2026**.
- **Last Genuinely Completed Feature**: Assessment Integrity Signals (Unit 49) — complete with the frontend monitoring hook `useAssessmentIntegrity.ts`, violation toasts, and automated backend test suite `integrityVerification.test.ts`.
- **Where Development Stopped**: At the transition into Phase 8 UI integration and Phase 9 project freeze. Units 46, 47, and 48 have robust backend services and tests but lack React UI views.

---

## 13. Known Bugs, Discrepancies & Technical Debt

### 13.1 Critical (None)
No runtime crashes or type errors exist. The application compiles and runs cleanly in both frontend and backend.

### 13.2 Important (Divergences to Note)
1. **Unmigrated Database Tables**: `001_initial_schema.sql` defines 15 baseline tables. Later backend services check for `verification_proofs` (`proofService.ts`) and `job_postings` (`jobPostingService.ts`). When running against a bare Supabase database without these two tables, the catch blocks trigger and seamlessly fall back to in-memory Maps.
2. **Missing UI Pages for Units 46, 47, 48**:
   - Resume Upload / Extraction has backend endpoints (`/api/resume/*`) and frontend client (`resumeApi.ts`), but no React UI page in `App.tsx`.
   - Domain Diagnostic has backend endpoints (`/api/assessment/diagnostic/*`) and client (`diagnosticApi.ts`), but no React UI page in `App.tsx`.
3. **Disconnected `ProfileView.tsx`**: `frontend/src/components/profile/ProfileView.tsx` is completely implemented with fields for display name, institution, career goal, GitHub URL, and LinkedIn URL, but is omitted from the navigation bar in `App.tsx`.

### 13.3 Minor
1. **Placeholder Directories**: `backend/src/ai/index.ts` and `backend/src/projects/index.ts` are 3-line boundary export placeholders.
2. **Token Fallbacks**: Several endpoints (`/api/career/match/*`, `/api/ranking/my-score`) include fallback user resolution (`user-current` or `demo-user-1`) for demonstration resilience when unauthenticated.

---

## 14. Master AI Prompt Injection Block

*Copy and paste the following block into any AI prompt to immediately grant it 100% technical context on Hiresense_AI:*

```text
[SYSTEM CONTEXT: HIRESENSE_AI]
You are assisting with Hiresense_AI, a university capstone web application built with React 18, Vite 5, Tailwind CSS, Node.js/Express, TypeScript, and PostgreSQL (Supabase).
Core Concept: Learn → Assess → Verify → Build Competency Profile → Analyze Career Gap → Practice Interview → Measure Readiness → Ranking.
Core Invariant: Skills are NEVER verified by user assertion, resume text, or AI prompts. A skill becomes VERIFIED strictly by passing a server-side timed assessment with score >= 80.0%. Passing attempts receive a cryptographic SHA-256 HMAC proof artifact (PRF-XXXX-XXXX).
Monthly Limit: Maximum 3 assessment attempts per skill per calendar month.
Integrity Rules: Attempts with > 3 tab switches or integrity score < 60 are disqualified.
Ranking: Deterministic 5-factor formula (40% Skill Mastery, 20% Skill Difficulty, 15% Domain Coverage, 15% Project Completion, 10% Mock Interview).
AI Reality: Operates under zero-budget constraints. Zero external LLM APIs are called. Uses deterministic keyword taxonomy matchers, rubric evaluators, and STAR method parsers.
Current Status: Units 01-45, 49 are fully complete with UI. Units 46-48 have complete backend APIs and tests but lack React views. ProfileView.tsx exists but is unmounted. 100% TypeScript clean.
```
