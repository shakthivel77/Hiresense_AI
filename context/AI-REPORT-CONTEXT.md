# Hiresense_AI — Academic Report & Viva Voce Knowledge Base
**Final-Year Engineering Project Comprehensive Documentation & Technical Defense Dossier**

---

## 1. Project Metadata & Executive Summary

- **Project Title**: Hiresense_AI: An Automated Skill Verification and Career Readiness Engine
- **Academic Degree**: Bachelor of Engineering / Technology in Computer Science & Engineering / Artificial Intelligence
- **Team Size**: 3 Student Engineers
- **Development Constraints**: Zero budget, 55-day milestone schedule, open-source stack, deterministic algorithmic verification
- **Core Technology Stack**: React 18, Vite 5, Tailwind CSS, Node.js, Express.js, TypeScript 5.4, PostgreSQL / Supabase, Node Crypto
- **Executive Summary**:
  Hiresense_AI is a web application designed to bridge the trust gap between self-declared candidate resumes and genuine engineering competency. Traditional career platforms treat skill claims as unverified strings, leading to resume inflation and credential opacity. Hiresense_AI introduces an authoritative, closed-loop verification pipeline:
  $$\text{Learn} \longrightarrow \text{Assess} \longrightarrow \text{Verify} \longrightarrow \text{Build Competency Profile} \longrightarrow \text{Analyze Career Gap} \longrightarrow \text{Practice Interview} \longrightarrow \text{Measure Readiness} \longrightarrow \text{Ranking}$$
  Skills are modeled as a Directed Acyclic Graph (DAG) enforcing strict prerequisite sequencing. A skill is verified only when a candidate achieves $\ge 80.0\%$ on a timed, proctored assessment governed by a strict limit of 3 attempts per calendar month and real-time browser integrity signals. Verified skills receive cryptographic SHA-256 HMAC proof artifacts. The platform evaluates job compatibility through weighted matching, conducts rubric-driven technical and STAR behavioral mock interviews, and computes a deterministic, 5-factor competency score for bias-free ranking.

---

## 2. Chapter 1: Introduction, Problem Statement & System Comparison

### 2.1 Introduction
The modern software engineering recruitment landscape suffers from severe information asymmetry. While job seekers present extensive lists of programming languages and frameworks on resumes and social profiles, technical recruiters have no reliable mechanism to verify whether the candidate possesses foundational problem-solving abilities or merely copied keywords. Consequently, organizations spend billions on preliminary screening, while qualified candidates from non-tier-1 institutions struggle to prove their practical capabilities.

### 2.2 Problem Statement
1. **Unverified Claims**: Traditional portals (LinkedIn, Indeed) accept self-declared skills without validation.
2. **Disconnected Learning**: Online course platforms (Coursera, Udemy) provide certificates of video completion rather than rigorous, prerequisite-enforced competency testing.
3. **Black-Box Algorithmic Bias**: Commercial applicant tracking systems (ATS) discard resumes based on opaque keyword matching without evaluating underlying prerequisite mastery.
4. **Lack of Actionable Career Guidance**: Candidates who fail job applications receive generic rejection notices without a deterministic breakdown of their skill gaps or a roadmap to bridge them.

### 2.3 Existing System vs. Proposed Hiresense_AI System

| Parameter | Existing Systems (LinkedIn, Udemy, LeetCode) | Proposed Hiresense_AI System |
|---|---|---|
| **Skill Validation** | Self-declared or video-watch certificates | Authoritative server-side testing ($\ge 80\%$ threshold required) |
| **Prerequisite Logic** | Flat lists; no enforcement of learning dependencies | Directed Acyclic Graph (DAG); advanced skills locked until prerequisites pass |
| **Tamper Resistance** | Easily forgeable PDF certificates | Cryptographic SHA-256 HMAC verification signatures with public URL validation |
| **Cheating Mitigation** | Minimal in self-paced environments | Real-time monitoring of tab switches, fullscreen exit, and clipboard violations |
| **Attempt Limits** | Unlimited instant re-tests or paywalled retakes | Strict constraint of 3 attempts per skill per calendar month |
| **Career Gap Analysis** | Keyword density scoring | Deterministic weighted compatibility (Required vs Preferred) with DAG navigation |
| **Interview Preparation** | Generic question lists or expensive human coaches | Automated rubric evaluations detecting technical signals, anti-patterns, and STAR structure |
| **Candidate Ranking** | Unverified popularity, endorsements, or raw problem count | Multi-factor weighted competency score (Mastery, Difficulty, Coverage, Projects, Interviews) |

---

## 3. Chapter 2: Project Objectives & System Scope

### 3.1 Primary Objectives
1. **Authoritative Skill Verification**: Implement a server-side assessment engine where skills transition to `VERIFIED` strictly upon achieving $\ge 80.0\%$.
2. **Prerequisite-Aware Curriculum Graphs**: Model technical domains as Directed Acyclic Graphs that dynamically compute `LOCKED`, `AVAILABLE`, `IN_PROGRESS`, and `VERIFIED` states.
3. **Cryptographic Proof Issuance**: Generate immutable, tamper-evident SHA-256 HMAC verification tokens with public recruiter verification pages and embeddable SVG badges.
4. **Deterministic Career Intelligence**: Provide mathematical job compatibility scoring and identify missing critical vs optional skills without black-box bias.
5. **Rubric-Based Interview Evaluation**: Deliver structured technical and behavioral mock interview sessions evaluated against explicit domain rubrics and the STAR methodology.
6. **Transparent Competency Ranking**: Calculate a 5-factor normalized score and display global, domain, and institutional leaderboards.

### 3.2 In-Scope vs. Out-of-Scope Specifications

#### In-Scope
- React 18 frontend with interactive 2D HTML Canvas DAG visualizer, minimap, and HUD controls.
- Node.js/Express modular monolith backend with 11 isolated domain modules.
- PostgreSQL database schema with 15 relational tables, constraints, and foreign key cascades.
- In-memory resilience pattern allowing full local execution without an active cloud database.
- 3 standard software curricula: Backend Developer, Frontend Developer, AI & Data Engineer.
- Real-time client-side assessment integrity monitoring hook.
- Deterministic resume text extraction, section segmentation, and unverified claim ingestion.

#### Out-of-Scope (Deliberate Design Boundaries)
- Live commercial LLM API calls (OpenAI/Anthropic) to maintain the zero-budget constraint.
- Invasive biometric proctoring (webcam facial tracking, eye gaze analysis, microphone streaming).
- Third-party job board web scraping (LinkedIn, Indeed).
- Blockchain-based credential storage (replaced by zero-cost SHA-256 HMAC cryptography).
- Video/audio recording and streaming infrastructure.

---

## 4. Chapter 3: System Requirements Specification (SRS)

### 4.1 Functional Requirements (FR)
- **FR-01 (Authentication)**: Candidates must be able to register, sign in, and establish authenticated sessions via Supabase JWT or local development bypass.
- **FR-02 (Roadmap Navigation)**: Candidates must be able to switch between learning domains and inspect prerequisite dependencies on an interactive visual canvas.
- **FR-03 (Prerequisite Enforcement)**: The system must lock a skill if any of its direct upstream prerequisite skills are not in the `VERIFIED` state.
- **FR-04 (Assessment Execution)**: The system must present timed assessments with randomized multiple-choice questions whose answer keys are stripped on the server.
- **FR-05 (Scoring & Verification)**: The backend must evaluate submitted answers; scores $\ge 80.0\%$ must stamp the skill as `VERIFIED` in `user_skills`.
- **FR-06 (Attempt Limit)**: The system must reject assessment initiation if the candidate has completed 3 attempts for that skill within the current calendar month.
- **FR-07 (Integrity Tracking)**: The system must deduct integrity points for tab switching, window blur, fullscreen exits, and clipboard actions, disqualifying attempts with $> 3$ tab switches or integrity score $< 60$.
- **FR-08 (Cryptographic Proofs)**: The system must generate a SHA-256 HMAC signature for every verified skill and provide a public validation endpoint.
- **FR-09 (Job Gap Analysis)**: The system must accept pasted job descriptions, extract required and preferred skills, and calculate a percentage compatibility score against verified profile skills.
- **FR-10 (Mock Interview)**: The system must stage technical and behavioral questions, capture user answers, evaluate key signal presence, and format STAR feedback.
- **FR-11 (Competency Ranking)**: The system must compute the 5-factor competency score and sort candidates across global, domain, and university leaderboards.
- **FR-12 (Resume Claim Ingestion)**: The system must extract skills from uploaded resumes and stamp them strictly as `UNVERIFIED`.

### 4.2 Non-Functional Requirements (NFR)
- **NFR-01 (Performance)**: Client DAG layout computation and Bezier curve rendering must complete within 16ms (60 FPS) on standard desktop browsers.
- **NFR-02 (Security & Invariants)**: Server-side API endpoints must never trust client-asserted scores, attempt counts, verification statuses, or ranking metrics.
- **NFR-03 (Reliability & Fault Tolerance)**: Backend services must implement dual-mode persistence, operating smoothly via in-memory structures if database connections drop.
- **NFR-04 (Zero Cost)**: The entire application must be hostable on free-tier services without requiring paid external APIs.
- **NFR-05 (Type Safety)**: 100% strict TypeScript typing across frontend and backend with zero compile errors.

---

## 5. Chapter 4: System Architecture & Engineering Design

### 5.1 Architectural Style: Modular Monolith
Hiresense_AI avoids the distributed failure modes, network latency, and operational overhead of microservices by adopting a **Modular Monolith** architecture:
- Single deployment unit.
- Clean logical boundaries organized by domain (`auth`, `users`, `roadmap`, `skills`, `assessment`, `portfolio`, `career`, `interview`, `ranking`, `resume`).
- Direct in-process communication between domain services via strongly typed TypeScript interfaces.
- Shared persistence layer backed by PostgreSQL and managed by Supabase.

### 5.2 System Architecture Diagram
```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                 │
│                                                                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────────────────┐  │
│  │   Roadmap View   │  │  Portfolio View  │  │     Job Analyzer View     │  │
│  │ (Canvas + Nodes) │  │  (Proofs, Badges)│  │     (Gap Matrix & HUD)    │  │
│  └────────┬─────────┘  └────────┬─────────┘  └─────────────┬─────────────┘  │
│           │                     │                          │                │
│  ┌────────▼─────────┐  ┌────────▼─────────┐  ┌─────────────▼─────────────┐  │
│  │MockInterview View│  │ Leaderboard View │  │  Timed Assessment Modal   │  │
│  │ (STAR Evaluator) │  │ (5-Factor Rank)  │  │  (Integrity Signals Hook) │  │
│  └────────┬─────────┘  └────────┬─────────┘  └─────────────┬─────────────┘  │
└───────────┼─────────────────────┼──────────────────────────┼────────────────┘
            │                     │                          │
            │ REST API via Fetch  │ JSON Payloads            │ Bearer Tokens
            ▼                     ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BACKEND MODULAR MONOLITH                           │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │             Express.js HTTP Router & Auth Middleware                  │  │
│  └──────────────────────────────────┬────────────────────────────────────┘  │
│                                     │                                       │
│    ┌──────────────┬─────────────────┼─────────────────┬────────────────┐    │
│    ▼              ▼                 ▼                 ▼                ▼    │
│ ┌─────────┐ ┌───────────┐   ┌──────────────┐   ┌─────────────┐ ┌──────────┐ │
│ │ Roadmap │ │  Skills   │   │  Assessment  │   │  Portfolio  │ │  Career  │ │
│ │ Service │ │  Service  │   │ & Integrity  │   │Proof Service│ │Gap Engine│ │
│ └─────────┘ └───────────┘   └──────────────┘   └─────────────┘ └──────────┘ │
│    ▲              ▲                 ▲                 ▲                ▲    │
│    │ ┌────────────┴─────────────────┼─────────────────┴────────────┐   │    │
│    │ │                              │                              │   │    │
│ ┌──┴─┴────┐                  ┌──────┴───────┐               ┌──────┴───┴──┐ │
│ │Interview│                  │Ranking Score │               │Resume Parser│ │
│ │Evaluator│                  │    Engine    │               │ & Extractor │ │
│ └─────────┘                  └──────────────┘               └─────────────┘ │
└─────────────────────────────────────┬───────────────────────────────────────┘
                                      │
                         Dual-Mode Persistence Adapter
                                      │
                   ┌──────────────────┴──────────────────┐
                   ▼                                     ▼
        ┌─────────────────────┐               ┌─────────────────────┐
        │ PostgreSQL Database │               │  In-Memory Fallback │
        │     (Supabase)      │               │     Store (Maps)    │
        └─────────────────────┘               └─────────────────────┘
```

### 5.3 Data Flow Diagrams (DFD)

#### DFD Level 0 (Context Diagram)
```text
                     Candidate Credentials
                     Assessment Answers
                     Job Descriptions
                     Resume Files
[ CANDIDATE / USER ] ──────────────────────► ┌────────────────────┐
                                             │                    │
                     Verification Proofs     │   HIRESENSE_AI     │
                     Roadmap Visualizations  │   SYSTEM CORE      │
                     Gap Analysis & Ranks    │                    │
[ CANDIDATE / USER ] ◄────────────────────── └──────────┬─────────┘
                                                        │
                     Proof Verification Request         │ Read Public Proofs
[ RECRUITER / PUBLIC] ──────────────────────────────────┼────────────────────►
                     Cryptographic SVG Badge & Proof Card│
[ RECRUITER / PUBLIC] ◄─────────────────────────────────┘
```

#### DFD Level 1 (Core Subsystems)
```text
Candidate ──► [1.0 Auth & Profile] ──► User Record ──► (profiles table)
                     │
Candidate ──► [2.0 Roadmap Engine] ◄── Prerequisite Rules ◄── (skills, dependencies)
                     │
Candidate ──► [3.0 Assessment Engine] ◄── Questions ◄── (question_banks)
                     │
                     ├── Passes (Score >= 80% & Clean Integrity)
                     ▼
              [4.0 Proof Generator] ──► SHA-256 Proof ──► (verification_proofs)
                     │
Candidate ──► [5.0 Career Gap Engine] ◄── Job Descriptions ◄── (job_postings)
                     │
Candidate ──► [6.0 Mock Interview] ◄── Rubrics & Signals ◄── (interview_questions)
                     │
Candidate ──► [7.0 Ranking Engine] ──► 5-Factor Score ──► Leaderboards
```

---

## 6. Chapter 5: Detailed Module Specifications

### 6.1 Module 1: Authentication & User Profile (`auth`, `users`)
- **Purpose**: Authenticate users, manage user sessions, and maintain profile attributes.
- **Implementation**: Utilizes `@supabase/supabase-js` to validate incoming JWT Bearer tokens. In development mode, supports `mock-dev-token` mapping to a pre-seeded developer profile.
- **Key Files**: `backend/src/auth/middleware.ts`, `backend/src/users/service.ts`, `frontend/src/context/AuthContext.tsx`.

### 6.2 Module 2: Roadmap & Skill State Engine (`roadmap`, `skills`)
- **Purpose**: Normalize curricula into Directed Acyclic Graphs and dynamically compute user skill progression states.
- **Logic**:
  - `LOCKED`: At least one direct prerequisite skill is not `VERIFIED`.
  - `AVAILABLE`: All direct prerequisites are `VERIFIED`, but the candidate has not passed the test.
  - `IN_PROGRESS`: An assessment has been initiated or the skill is claimed.
  - `VERIFIED`: The candidate has achieved $\ge 80.0\%$ on a proctored assessment.
- **Cross-Domain Reuse**: Once a skill (e.g. `javascript-basics`) is verified, it is automatically recognized as verified across all other domain roadmaps requiring it.

### 6.3 Module 3: Skill Graph Visualizer (`frontend/src/components/visualizer/`)
- **Purpose**: Interactive 2D graphical representation of the curriculum DAG.
- **Algorithms**:
  - `layoutEngine.ts`: Sugiyama-style layered rank assignment and cubic Bezier curve generation.
  - `traversalEngine.ts`: DFS cycle validation, BFS prerequisite ancestor discovery, downstream unlock cascade resolution, and Dijkstra-based shortest learning path to a target career goal.
  - `MiniMap.tsx`: Real-time scaled overview canvas with viewport dragging.
  - `SkillProfileOverlay.tsx`: Real-time HUD showing domain progress, difficulty badges, attempt limits, and instant assessment triggers.

### 6.4 Module 4: Assessment & Integrity Engine (`assessment`)
- **Purpose**: Timed candidate evaluation with server-side scoring and cheating mitigation.
- **Rules**:
  - Questions are selected randomly from skill pools. Answer keys and explanations are stripped on the server before transmitting to the client (`sanitizeQuestionForClient`).
  - Strict passing threshold: $\text{Score} \ge 80.0\%$.
  - Attempt restriction: Maximum 3 attempts per skill per calendar month (UTC).
  - Anti-cheating hook (`useAssessmentIntegrity.ts`): Tracks window blur, tab switching, fullscreen cancellation, and clipboard copy/paste. Attempts with $> 3$ tab switches or integrity score $< 60$ are disqualified (`passed = false`, status `FLAGGED`), blocking verification.

### 6.5 Module 5: Verification Portfolio & Proofs (`portfolio`)
- **Purpose**: Issue and publicly verify tamper-evident cryptographic skill credentials.
- **Cryptography**: Computes a SHA-256 HMAC digest over `{ userId, skillId, score, attemptId, verificationDate }` using a server secret key.
- **Public Verification**: Recruiter endpoints `/api/portfolio/verify/:proofId` and `/api/portfolio/badge/:proofId.svg` dynamically generate SVG badges and validate cryptographic signatures without requiring recruiter login.

### 6.6 Module 6: Career Intelligence & Gap Analysis (`career`)
- **Purpose**: Deterministic comparison of candidate verified skills against job requirements.
- **Processing**:
  - Regex taxonomy keyword extractor (`jobExtractorService.ts`) with synonym mapping.
  - Categorizes requirements into Required ($W = 1.0$) and Preferred ($W = 0.5$).
  - Produces a transparent Compatibility Score ($0 - 100\%$) and classifies gaps into `MATCHED`, `MISSING_CRITICAL`, `MISSING_OPTIONAL`, and `CLAIMED_UNVERIFIED`.

### 6.7 Module 7: Mock Interview Engine (`interview`)
- **Purpose**: Text-based technical and behavioral mock interview simulator.
- **Heuristic Rubric Evaluation**:
  - Evaluates answers against pre-seeded questions containing `keySignals`, `antiPatterns`, and `idealAnswerOutline`.
  - Signal stem matching using stop-word stripping and 35% keyword stem presence.
  - Articulation depth bonuses for responses $\ge 60$ and $\ge 100$ words.
  - Penalties (-15 pts) for detected engineering anti-patterns.
  - STAR formatter (`starFeedbackFormatterService.ts`) parsing Situation, Task, Action, and Result markers.

### 6.8 Module 8: Competency Ranking & Leaderboards (`ranking`)
- **Purpose**: Impartial, deterministic candidate scoring and multi-scope leaderboards.
- **Formula**:
  $$S_{\text{composite}} = 0.40 \times S_{\text{mastery}} + 0.20 \times S_{\text{difficulty}} + 0.15 \times S_{\text{coverage}} + 0.15 \times S_{\text{project}} + 0.10 \times S_{\text{interview}}$$
- **Scopes**: Filterable across Global, Domain Track, and Educational Institution (e.g. IIT Madras, Stanford, MIT).

---

## 7. Chapter 6: Database Design & Relational Modeling

### 7.1 Data Dictionary

#### Table: `profiles`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, REFERENCES auth.users(id) ON DELETE CASCADE` | Supabase auth user identifier |
| `email` | `TEXT` | `NOT NULL, UNIQUE` | Candidate email address |
| `display_name`| `TEXT` | `NOT NULL` | Candidate full name |
| `role` | `TEXT` | `NOT NULL, CHECK (role IN ('student', 'professional', 'admin'))` | System access role |
| `institution` | `TEXT` | `NULL` | University or organization |
| `career_goal` | `TEXT` | `NULL` | Target engineering specialization |
| `github_url` | `TEXT` | `NULL` | Public GitHub profile link |
| `linkedin_url`| `TEXT` | `NULL` | Public LinkedIn profile link |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Record update timestamp |

#### Table: `skills`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, DEFAULT uuid_generate_v4()` | Unique skill identifier |
| `slug` | `TEXT` | `NOT NULL, UNIQUE` | URL-safe slug (e.g. `nodejs-express`) |
| `name` | `TEXT` | `NOT NULL` | Human-readable skill name |
| `description` | `TEXT` | `NULL` | Detailed technical scope |
| `category` | `TEXT` | `NOT NULL, DEFAULT 'core'` | Domain classification category |
| `difficulty` | `TEXT` | `CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'))` | Pedagogical difficulty tier |

#### Table: `skill_dependencies`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, DEFAULT uuid_generate_v4()` | Dependency edge identifier |
| `skill_id` | `UUID` | `FK REFERENCES skills(id) ON DELETE CASCADE` | Dependent child skill |
| `prerequisite_skill_id` | `UUID` | `FK REFERENCES skills(id) ON DELETE CASCADE` | Required parent skill |

*Composite Constraint: `UNIQUE (skill_id, prerequisite_skill_id)` preventing duplicate dependency edges.*

#### Table: `user_skills`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, DEFAULT uuid_generate_v4()` | Record identifier |
| `user_id` | `UUID` | `FK REFERENCES profiles(id) ON DELETE CASCADE` | Candidate identifier |
| `skill_id` | `UUID` | `FK REFERENCES skills(id) ON DELETE CASCADE` | Skill identifier |
| `status` | `TEXT` | `CHECK (status IN ('CLAIMED', 'UNVERIFIED', 'VERIFIED'))` | Verification state |
| `verification_score` | `NUMERIC(5,2)`| `NULL` | Passing test score |
| `verification_date` | `TIMESTAMPTZ` | `NULL` | Verification timestamp |
| `attempt_count` | `INT` | `DEFAULT 0` | Total attempts taken |
| `last_attempt_at` | `TIMESTAMPTZ` | `NULL` | Timestamp of most recent attempt |

*Composite Constraint: `UNIQUE (user_id, skill_id)` enforcing a single progression record per skill per user.*

#### Table: `test_attempts`
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, DEFAULT uuid_generate_v4()` | Attempt identifier |
| `test_id` | `UUID` | `FK REFERENCES tests(id) ON DELETE CASCADE` | Associated test config |
| `user_id` | `UUID` | `FK REFERENCES profiles(id) ON DELETE CASCADE` | Candidate identifier |
| `score` | `NUMERIC(5,2)`| `NOT NULL` | Evaluated percentage score |
| `passed` | `BOOLEAN` | `DEFAULT FALSE` | True if score $\ge 80\%$ and clean |
| `started_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Test session start time |
| `completed_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` | Submission timestamp |

---

## 8. Chapter 7: Mathematical Formulations & Complexity Analysis

### 8.1 Mathematical Formulations

#### 1. Hiresense Composite Competency Formulation
$$S_{\text{composite}} = w_1 S_{\text{mastery}} + w_2 S_{\text{difficulty}} + w_3 S_{\text{coverage}} + w_4 S_{\text{project}} + w_5 S_{\text{interview}}$$
$$\sum_{j=1}^5 w_j = 0.40 + 0.20 + 0.15 + 0.15 + 0.10 = 1.00$$

#### 2. Difficulty-Normalized Mastery Component
$$S_{\text{difficulty}} = \frac{\sum_{i=1}^{k} \left(\text{Score}_i \times D(s_i)\right)}{2.0 \times \sum_{i=1}^{k} D(s_i)} \times 100$$
Where:
$$D(s) = \begin{cases} 1.0 & \text{if difficulty} = \text{beginner} \\ 1.5 & \text{if difficulty} = \text{intermediate} \\ 2.0 & \text{if difficulty} = \text{advanced} \end{cases}$$

#### 3. Assessment Integrity Disqualification Model
$$\text{Penalty} = 10 \cdot T_{\text{switches}} + 15 \cdot F_{\text{exits}} + 5 \cdot C_{\text{clipboard}}$$
$$I_{\text{score}} = \max(0, 100 - \text{Penalty})$$
$$\text{Disqualified} \iff (T_{\text{switches}} > 3) \lor (I_{\text{score}} < 60)$$

#### 4. Cryptographic Proof HMAC Formulation
$$\mathcal{H} = \text{HMAC-SHA256}\Big(\text{userId} \parallel \text{skillId} \parallel \text{score} \parallel \text{attemptId} \parallel \text{timestamp}, \; K_{\text{secret}}\Big)$$

---

### 8.2 Algorithmic Complexity Analysis

| Algorithm | Implementation Location | Time Complexity | Space Complexity | Description |
|---|---|---|---|---|
| **DAG Cycle Validation** | `traversalEngine.ts:validateDAG` | $\mathcal{O}(V + E)$ | $\mathcal{O}(V)$ | 3-color DFS traversal detecting directed back-edges |
| **Prerequisite Resolution** | `traversalEngine.ts:getPrerequisites` | $\mathcal{O}(V + E)$ | $\mathcal{O}(V)$ | Reverse BFS resolving all transitive ancestors |
| **Unlock Cascade Simulation**| `traversalEngine.ts:simulateUnlock` | $\mathcal{O}(V + E)$ | $\mathcal{O}(V)$ | Evaluates lock state deltas across downstream subgraphs |
| **Curriculum Shortest Path** | `traversalEngine.ts:findLearningPath`| $\mathcal{O}(V \log V + E)$ | $\mathcal{O}(V)$ | Dijkstra traversal to target skill from verified roots |
| **Sugiyama Layering** | `layoutEngine.ts:computeLayout` | $\mathcal{O}(V \cdot d_{\text{max}} + E)$ | $\mathcal{O}(V)$ | Topological rank layering with barycenter ordering |
| **Cubic Bezier Rendering** | `SkillGraphCanvas.tsx` | $\mathcal{O}(1)$ per edge | $\mathcal{O}(1)$ | Real-time 2D Canvas parametric curve interpolation |
| **Rubric Stem Matching** | `interviewEvaluatorService.ts` | $\mathcal{O}(N_{\text{words}} \cdot N_{\text{signals}})$ | $\mathcal{O}(N_{\text{signals}})$ | Stop-word filtered keyword stem overlap analysis |
| **HMAC SHA-256 Hashing** | `proofService.ts:generateProofHash`| $\mathcal{O}(L_{\text{payload}})$ | $\mathcal{O}(1)$ | Single-pass streaming SHA-256 cryptographic digest |

---

## 9. Chapter 8: Verification, Testing & Empirical Results

### 9.1 Automated Test Execution Log

All verification test suites execute cleanly via `npx tsx`:

```text
1. backend/src/ranking/rankingVerification.test.ts
   --- STARTING UNIT 44 VERIFICATION ---
   1. Verifying Benchmark Profiles and Scores: PASSED (Priya Sharma: 90.65, MASTER)
   2. Verifying Global Leaderboard & Descending Sort: PASSED (6 seeded profiles)
   3. Verifying Domain Filter (backend-developer): PASSED (3 profiles)
   4. Verifying Institution Filter (Stanford): PASSED (1 profile)
   5. Verifying Tier Filter (EXPERT): PASSED (3 profiles)
   6. Verifying Score Distribution Analytics: PASSED (Avg: 78.79)
   7. Dynamic Candidate Update & Re-ranking: PASSED (#1 Rank, 95.5 Score)
   --- ALL UNIT 44 VERIFICATIONS PASSED ---

2. backend/src/assessment/diagnosticVerification.test.ts
   --- STARTING UNIT 48 DOMAIN DIAGNOSTIC VERIFICATION ---
   1. Generating Domain Diagnostic (backend-developer): PASSED (6 questions across 3 skills)
   2. Simulating Diagnostic Submission with mixed mastery: PASSED (2 Verified, 1 Unverified)
   --- ALL UNIT 48 VERIFICATIONS PASSED SUCCESSFULLY ---

3. backend/src/assessment/integrityVerification.test.ts
   --- STARTING UNIT 49 ASSESSMENT INTEGRITY SIGNALS VERIFICATION ---
   1. Clean assessment attempt (100% score, 100% integrity): PASSED (Passed: true, Flagged: false)
   2. Attempt with > 3 tab switches (4 switches): PASSED (Disqualified, Passed: false)
   3. Attempt with integrity score < 60 (Score 55): PASSED (Disqualified, Passed: false)
   --- ALL UNIT 49 ASSESSMENT INTEGRITY SIGNALS TESTS PASSED ---

4. backend/src/resume/resumeVerification.test.ts
   --- STARTING UNIT 46 RESUME TEXT EXTRACTION VERIFICATION ---
   1. Processing sample plain text resume: PASSED (1295 characters)
   2. Verifying Contact Extraction: PASSED (Name, email, phone, links)
   3. Verifying Work Experience & Education: PASSED (2 jobs, 1 degree)
   4. Verifying Skill Tokens & Projects: PASSED (12 tokens, 1 project)
   5. Base64 payload decoding & Invariant notice: PASSED
   --- ALL UNIT 46 VERIFICATIONS PASSED SUCCESSFULLY ---

5. backend/src/resume/skillExtractionVerification.test.ts
   --- STARTING UNIT 47 RESUME SKILL EXTRACTION VERIFICATION ---
   1. Extracting skills from resume text: PASSED (12 taxonomy skills matched)
   2. Verifying UNVERIFIED Status Invariant on all claims: PASSED (Null scores, UNVERIFIED)
   3. Diagnostic Recommendations: PASSED (Top 5 unverified skills selected)
   --- ALL UNIT 47 VERIFICATIONS PASSED SUCCESSFULLY ---
```

### 9.2 TypeScript Static Compilation Results
- `backend/`: `npx tsc --noEmit` exited with code `0` (0 errors).
- `frontend/`: `npx tsc --noEmit` exited with code `0` (0 errors).

---

## 10. Chapter 9: System Limitations & Architectural Trade-offs

### 10.1 Technical & Implementation Limitations
1. **Unmigrated Database Schema Extensions**: The initial migration (`001_initial_schema.sql`) contains 15 baseline tables. Phase 3 (`verification_proofs`) and Phase 4 (`job_postings`) store their data in in-memory Maps with fallback try-catches. A secondary SQL migration `002_extensions.sql` is required for production database synchronicity.
2. **Missing Frontend Views for Ingestion Units**: Units 46, 47 (Resume Extraction) and Unit 48 (Domain Diagnostics) have fully implemented backend REST APIs and client libraries, but lack dedicated UI screens in `App.tsx`.
3. **Unmounted Profile View**: `frontend/src/components/profile/ProfileView.tsx` exists as a complete profile management component but is not wired into the sidebar navigation tabs in `App.tsx`.
4. **Heuristic AI vs. Generative LLMs**: The system uses deterministic rubric parsing and keyword stem tokenization rather than commercial LLMs. While this guarantees zero operational cost, it cannot evaluate conversational nuances as flexibly as a large language model.

---

## 11. Chapter 10: Future Enhancements & Commercial Roadmap

### 11.1 Documented Future Enhancements (From Specs)
1. **Unit 50 (GitHub Public Contribution Engine)**: Automated analyzer querying the public GitHub API to extract commit velocity, repository language breakdown, and issue contributions as verified project signals.
2. **Phase 9 End-to-End Hardening & Packaging**: Completion of end-to-end user journeys, unified settings dashboard, and demo staging.
3. **Dedicated Resume & Diagnostic UI Modules**: Drag-and-drop resume upload zone and multi-skill diagnostic quiz interface.

### 11.2 Author Recommendations for Enterprise Scale
1. **Pluggable Local LLM Integration**: Integrate local open-source models (e.g. Llama 3 or Mistral via Ollama) into `backend/src/ai/` to enable zero-cost generative evaluations without cloud API spend.
2. **Secondary SQL Migration Script**: Formalize `002_extensions.sql` defining `verification_proofs`, `job_postings`, and `resume_claims` with Row Level Security (RLS) policies.
3. **Browser Webcam Snapshot Auditing**: Optional snapshot verification during timed tests to elevate proctoring assurance for enterprise hiring tiers.

---

## 12. Viva Voce Comprehensive Defense Guide (30 Questions & Answers)

### Architecture & Design Decisions
**Q1: Why did you choose a Modular Monolith over Microservices?**
*Answer*: For a team of 3 engineers with a 55-day milestone and zero budget, microservices would introduce excessive operational overhead (service meshes, distributed tracing, network latency, Docker container orchestration, distributed transactions). A Modular Monolith provides strict architectural domain separation (`auth`, `skills`, `assessment`, etc.) while retaining single-process execution, compile-time type safety across modules, and atomic database transactions.

**Q2: How does the application guarantee zero operating costs?**
*Answer*: 1) Uses Supabase free-tier PostgreSQL and Auth; 2) Employs deterministic expert systems, regex taxonomy matchers, and rubric evaluators instead of paid LLM API calls (OpenAI/Anthropic); 3) Replaces paid blockchain certificate platforms with local Node.js SHA-256 HMAC cryptography; 4) Employs lightweight, self-hosted static builds via Vite and Node.js.

**Q3: How does the backend handle a dropped database connection or missing Supabase keys?**
*Answer*: Every backend service implements a dual-mode resilience pattern. Services maintain internal in-memory TypeScript `Map` structures pre-seeded with authentic curriculum, benchmark jobs, and candidates. If Supabase credentials are not configured or queries fail, errors are caught gracefully, and the application serves requests seamlessly from memory without crashing.

**Q4: Why is there a disconnect between `001_initial_schema.sql` and later services like `proofService`?**
*Answer*: `001_initial_schema.sql` established the 15 baseline tables for Phases 0–2. As Phases 3–8 were developed incrementally using spec-driven units, services such as `proofService` and `jobPostingService` were written to support Supabase tables (`verification_proofs`, `job_postings`) while maintaining in-memory resilience. A second migration script (`002_extensions.sql`) is planned for Phase 9 to formally align the remote PostgreSQL schema.

### Core Business Logic & Invariants
**Q5: What is the core business invariant of Hiresense_AI?**
*Answer*: A skill can NEVER become `VERIFIED` by user self-declaration, resume uploads, or AI prompt assertions. Verification strictly requires achieving $\ge 80.0\%$ on an authoritative, server-side timed assessment.

**Q6: What happens if a candidate uploads a resume containing "React" and "Node.js"?**
*Answer*: The resume extraction engine (`ResumeSkillExtractor`) parses the text and identifies the skills, but stamps them strictly as `UNVERIFIED` self-claims with `verificationScore = null`. They are added to the candidate's profile as claims and recommended for diagnostic testing, but never count toward verified mastery or leaderboards.

**Q7: How is the 3 attempts per month limit enforced?**
*Answer*: When a candidate attempts to start an assessment (`POST /api/assessment/start`), the backend queries all completed attempts for that `userId` and `skillId`. It filters for attempts where the timestamp matches the current UTC year and month. If the count $\ge 3$, the server immediately rejects the request with HTTP `429 ATTEMPT_LIMIT_EXCEEDED`, returning the exact days until the next calendar month reset.

**Q8: What prevents a user from inspecting the browser network tab to cheat on tests?**
*Answer*: The backend runs a sanitization function (`sanitizeQuestionForClient`) before returning questions to the client. The `correct_option_index` and `explanation` fields are stripped on the server. The client only receives the question text and array of options. Scoring occurs entirely on the server upon submission.

### Assessment Integrity & Proctoring
**Q9: How does the assessment integrity monitoring engine work?**
*Answer*: The frontend hook `useAssessmentIntegrity.ts` attaches event listeners for `visibilitychange` (tab switches), `window.blur` (focus loss), `fullscreenchange` (exiting fullscreen), and clipboard events (`copy`, `paste`, `contextmenu`). Violations trigger real-time toasts and deduct from an integrity score (10 pts per tab switch, 15 pts per fullscreen exit, 5 pts per clipboard action).

**Q10: What triggers an automatic assessment disqualification?**
*Answer*: Upon submission, if `tabSwitchCount > 3` OR `integrityScore < 60`, the backend automatically marks the attempt as disqualified (`passed = false`, status `FLAGGED`), even if the candidate scored 100% academically. Disqualified attempts never verify the skill and never generate a cryptographic proof artifact.

### Cryptography & Proof System
**Q11: How do verification proofs work without a blockchain?**
*Answer*: The `ProofService` creates a tamper-evident digital artifact by computing a SHA-256 Hash-based Message Authentication Code (HMAC) over the concatenation of `userId`, `skillId`, `score`, `attemptId`, and `verificationDate` using a server secret key. Anyone with the proof ID can query the public endpoint `/api/portfolio/verify/:proofId` to verify that the score and date match the HMAC signature.

**Q12: How are embeddable SVG verification badges generated?**
*Answer*: The endpoint `/api/portfolio/badge/:proofId.svg` dynamically streams raw SVG XML with `Content-Type: image/svg+xml`. It renders the verified skill title, score percentage, date, and tamper-evident proof ID directly onto an aesthetic dark-themed SVG card, complete with verification branding for GitHub READMEs or personal portfolios.

### Algorithms & Data Structures
**Q13: Why did you model curricula as Directed Acyclic Graphs (DAGs)?**
*Answer*: Engineering skills have strict hierarchical dependencies (e.g. one cannot understand Express.js without understanding JavaScript async control flow and HTTP basics). A DAG allows us to mathematically enforce topological ordering, validate that no circular dependencies exist (via DFS 3-color vertex cycle detection), and simulate learning paths.

**Q14: Explain the 5 components of the Hiresense Competency Score.**
*Answer*:
1. **Skill Mastery (40%)**: Average score across all passed assessments ($\ge 80\%$).
2. **Skill Difficulty (20%)**: Weighted average where Beginner = $1.0\times$, Intermediate = $1.5\times$, Advanced = $2.0\times$, normalized against max weight 2.0.
3. **Domain Coverage (15%)**: Proportion of total track skills verified.
4. **Project Completion (15%)**: Score derived from completed practical projects.
5. **Mock Interview Performance (10%)**: Average score achieved in technical and behavioral mock interview evaluations.

**Q15: How does the Sugiyama layout algorithm work in your DAG Visualizer?**
*Answer*: It assigns vertices to horizontal or vertical tiers based on maximum prerequisite depth (rank assignment), calculates barycentric positions among siblings to minimize crossing edges, and generates cubic Bezier splines connecting parent and child nodes.

**Q16: How does the Job Analyzer calculate compatibility?**
*Answer*: It extracts required ($W = 1.0$) and preferred ($W = 0.5$) skills from the job description. The compatibility percentage is the sum of weights of verified skills matching the posting divided by the sum of weights of all posting requirements multiplied by 100.

**Q17: How are mock interview answers evaluated without an LLM?**
*Answer*: The `InterviewEvaluatorService` uses a structured rubric containing `keySignals` and `antiPatterns`. It tokenizes candidate answers, removes stop words, and checks for keyword stem matches against rubric signals. Coverage awards up to 70 points, articulation depth awards up to 30 points, and detected anti-patterns deduct 15 points each.

**Q18: What is the STAR method and how does your system format feedback?**
*Answer*: STAR stands for Situation, Task, Action, and Result. For behavioral interview questions, the `StarFeedbackFormatterService` analyzes responses for narrative markers indicating context (Situation), challenges (Task), execution steps (Action), and measurable outcomes (Result), providing actionable guidance on missing components.

### Database & Relational Modeling
**Q19: Explain the relationship between `profiles`, `skills`, and `user_skills`.**
*Answer*: `profiles` and `skills` participate in a Many-to-Many (N:M) relationship resolved through the associative entity `user_skills`. `user_skills` holds candidate-specific state (`status`, `verification_score`, `attempt_count`, `last_attempt_at`). A composite unique constraint on `(user_id, skill_id)` ensures a candidate has exactly one progression record per skill.

**Q20: How are recursive skill dependencies modeled?**
*Answer*: Through the `skill_dependencies` table, which represents a self-referential Many-to-Many relationship on the `skills` table. Both `skill_id` and `prerequisite_skill_id` are foreign keys referencing `skills(id)` with cascade deletes.

**Q21: What indexes did you implement to optimize database performance?**
*Answer*: B-Tree indexes on high-frequency query paths: `user_skills(user_id)`, `user_skills(status)`, `test_attempts(user_id)`, `test_attempts(test_id)`, `questions(question_bank_id)`, and `skill_dependencies(skill_id, prerequisite_skill_id)`.

### Project Management, Status & Gaps
**Q22: Where did development stop and what was the last completed feature?**
*Answer*: Development paused at commit `0bfaae0` on September 11, 2026. The last completed feature was Unit 49 (Assessment Integrity Signals), implementing real-time violation monitoring and automated backend tests.

**Q23: Which features have backend implementations but lack frontend UI?**
*Answer*: Unit 46 (Resume Text Extraction), Unit 47 (Resume Skill Extraction), and Unit 48 (Domain Diagnostics). All three have complete backend controllers, services, and tests, but lack dedicated screens in `App.tsx`. Additionally, `ProfileView.tsx` is implemented but unmounted.

**Q24: What are your planned next steps for Phase 9?**
*Answer*: 1) Create UI views for Resume Upload and Domain Diagnostics; 2) Mount `ProfileView` in the navigation bar; 3) Execute the secondary SQL migration script `002_extensions.sql`; 4) Perform final security and end-to-end integration passes before academic submission.

---
*(End of Academic Report & Viva Voce Knowledge Base)*
