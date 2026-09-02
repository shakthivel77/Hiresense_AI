# Hiresense_AI — Architecture Context

## Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | React + TypeScript | Interactive web application |
| Styling | Tailwind CSS | Utility-first styling |
| UI primitives | shadcn/ui or equivalent lightweight component layer | Consistent reusable UI |
| Backend | Node.js + Express.js + TypeScript | Modular REST API and business logic |
| Database | PostgreSQL via Supabase | Persistent application data |
| Authentication | Supabase Auth | User authentication and sessions |
| Storage | Supabase Storage, only when required | Temporary/necessary file storage such as resume uploads |
| AI | Replaceable AI provider through `AIService` abstraction | Extraction, generation, evaluation, recommendation |
| Roadmap source | developer-roadmap/roadmap.sh or another compatible open-source source | Initial roadmap content |
| Validation | Zod or equivalent schema validator | External/request/AI boundary validation |
| API testing | Postman or Thunder Client | API verification |
| Version control | Git + GitHub | Source control |
| Deployment | Free-tier services | Demonstration deployment only |

## Architectural Style

Use a **modular monolith**.

One backend application owns the domain modules. One PostgreSQL database is the source of truth. AI providers are accessed through a replaceable service abstraction. Do not introduce microservices or distributed infrastructure.

## System Boundaries

- `frontend/` — React UI, client-side state, navigation, presentation, and browser-only assessment signals.
- `backend/src/auth/` — authentication integration and authenticated-user context.
- `backend/src/users/` — profile and user-owned data.
- `backend/src/roadmap/` — roadmap adapters, normalization, domains, skills, and dependency graph logic.
- `backend/src/skills/` — skill state and verified-skill profile operations.
- `backend/src/assessment/` — question banks, test creation, attempts, scoring, verification, and attempt limits.
- `backend/src/resources/` — learning-resource metadata and skill-resource relationships.
- `backend/src/projects/` — project recommendation logic.
- `backend/src/career/` — job-description analysis, required-skill extraction, compatibility, and skill gaps.
- `backend/src/interview/` — interview sessions, questions, answers, and evaluations.
- `backend/src/ranking/` — deterministic competency scoring and leaderboard queries.
- `backend/src/ai/` — provider abstraction, prompts, structured outputs, caching hooks, and AI-specific validation.
- `backend/src/common/` — shared types, errors, validation utilities, logging, and cross-cutting infrastructure.
- `database/` — SQL migrations, indexes, seed data, and database documentation.
- `context/` — product, architecture, standards, workflow, UI, progress, and feature specifications.

## Storage Model

### PostgreSQL / Supabase Database

Store:

- User/profile metadata.
- Domains, roadmaps, skills, and dependency relationships.
- Resource metadata and URLs.
- Project metadata when persisted.
- Question banks.
- Tests and attempts.
- User skill verification records.
- Job analysis metadata and normalized requirements.
- Interview sessions and structured evaluation results.
- Ranking-related data or materialized calculations where useful.

### Supabase Storage

Use only when required for:

- Temporary resume uploads.
- Necessary user-uploaded artifacts.

Do not store large external course/video content.

Prefer extracting structured resume information and deleting temporary files when the file is no longer needed.

### External Sources

Store links and lightweight metadata rather than copying large external content.

## Authentication and Access Model

- Users authenticate through Supabase Auth.
- Backend endpoints derive the authenticated user from the verified session/token.
- Every mutation affecting user-owned data must enforce ownership.
- A user cannot modify another user's profile, skill verification, attempts, interviews, or job analyses.
- Public leaderboard reads may expose only the fields intended for ranking display.
- AI provider secrets must remain server-side.
- Client code must never be trusted for verification, attempt limits, ranking, or authorization.

## Core Domain Model

```text
User
 ├── Profile
 ├── UserSkill
 │     └── Skill
 │            └── SkillDependency
 ├── TestAttempt
 ├── JobAnalysis
 └── InterviewSession
```

Roadmap:

```text
Domain
  └── Roadmap
        └── Skill
              └── SkillDependency
```

Assessment:

```text
Skill
  └── QuestionBank
        └── Question

Test
  └── TestAttempt
        └── TestAnswer
```

Career:

```text
JobAnalysis
  └── JobRequirement
```

Interview:

```text
InterviewSession
  ├── InterviewQuestion
  ├── InterviewAnswer
  └── InterviewEvaluation
```

## Verification State Model

A user skill must distinguish:

- `CLAIMED`
- `UNVERIFIED`
- `VERIFIED`

A resume or user-entered skill can create a claimed/unverified record, but it cannot create a verified record.

Verification is determined by backend assessment logic:

```text
score >= 80
    -> VERIFIED

score < 80
    -> UNVERIFIED
```

## Roadmap State Model

A skill may be:

- `LOCKED`
- `AVAILABLE`
- `IN_PROGRESS`
- `VERIFIED`

The backend determines whether prerequisites are satisfied.

## Assessment Rules

- Tests use a reusable question bank.
- A test selects a defined number of questions from an eligible pool.
- The backend calculates the score.
- 80% or higher verifies the skill.
- A skill may be attempted at most three times per calendar month.
- The attempt limit is enforced server-side.
- Test integrity signals are advisory/integrity controls, not a claim of perfect anti-cheating enforcement.

## AI Boundary

AI is allowed to:

- Generate reusable assessment questions.
- Extract skills from resumes.
- Extract requirements from job descriptions.
- Recommend projects.
- Generate interview questions.
- Evaluate interview answers and produce feedback.

AI is not allowed to determine:

- Authentication.
- Authorization.
- Skill verification threshold.
- Attempt limits.
- Prerequisite unlocking.
- Final deterministic score formulas.
- User ownership.
- Database permissions.

## AI Service Contract

```text
AIService
 ├── generateQuestions(skillContext)
 ├── extractResumeSkills(text)
 ├── extractJobRequirements(jobDescription)
 ├── recommendProject(skillContext)
 ├── generateInterviewQuestions(context)
 └── evaluateInterviewAnswer(context)
```

All AI responses must be schema-validated before they enter trusted application logic.

## Roadmap Adapter

The application should not make its internal data model dependent on roadmap.sh.

```text
External Roadmap
      ↓
Roadmap Adapter
      ↓
Normalized Roadmap DTO
      ↓
Database
      ↓
Hiresense UI
```

A future adapter can support another source without rewriting the learning engine.

## Ranking Formula

Initial deterministic formula:

```text
Hiresense Score =
  40% Skill Mastery
+ 20% Skill Difficulty
+ 15% Domain Coverage
+ 15% Project Performance/Completion
+ 10% Interview Performance
```

All components must be normalized to 0–100.

If a component is unavailable in the MVP, the implementation must define a deterministic fallback rather than silently inventing a value.

Skill difficulty can use:

```text
Beginner      = 1.0
Intermediate  = 1.5
Advanced      = 2.0
```

## Job Compatibility

The system calculates a transparent skill compatibility score.

It must not claim or imply a probability of hiring.

Conceptually:

```text
Job Description
      ↓
Requirement Extraction
      ↓
Skill Normalization
      ↓
Verified Skill Comparison
      ↓
Matched / Missing Skills
      ↓
Compatibility Score
```

## Invariants

1. The database is the source of truth for application state.
2. Frontend checks are never the only enforcement of business or security rules.
3. A skill cannot become `VERIFIED` without a successful backend assessment.
4. Resume-extracted skills are never automatically verified.
5. The 80% threshold is enforced by backend code, not by an LLM.
6. The three-attempts-per-month rule is enforced by backend/database logic.
7. Skill unlocking is deterministic and based on prerequisite verification.
8. AI outputs are untrusted until schema-validated.
9. AI provider credentials never reach the browser.
10. External roadmap content passes through an adapter before entering the internal model.
11. Large external content is not copied into the database.
12. User-owned mutations require authentication and ownership checks.
13. Ranking calculations are deterministic and reproducible.
14. Request handlers must not contain uncontrolled long-running AI workflows.
15. New dependencies are introduced only when required by an approved feature unit.
