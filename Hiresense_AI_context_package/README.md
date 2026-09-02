# Hiresense_AI

Hiresense_AI is an AI-enabled competency and career-readiness platform for computer-science and software-engineering learners.

The system combines:

**Roadmap → Skill Graph → Learning → Assessment → Verification → Competency Profile → Career Gap Analysis → Interview → Readiness Score**

## Repository Context

The `context/` directory is the source of truth for project intent, architecture, implementation rules, UI conventions, workflow, and current progress.

Read these before implementation:

```text
context/
├── project-overview.md
├── architecture.md
├── code-standards.md
├── ai-workflow-rules.md
├── ui-context.md
├── progress-tracker.md
└── specs/
    └── 00-build-plan.md
```

The root `CLAUDE.md` is the coding-agent entry point.

## Project Constraints

- Team: 3 members
- Remaining time: approximately 55 days
- Budget: zero
- Project type: university final-year project
- Architecture: modular monolith
- Database: PostgreSQL through Supabase
- Authentication: Supabase Auth
- Frontend: React + TypeScript
- Backend: Node.js + Express.js + TypeScript
- AI: replaceable free/available model provider through `AIService`

## Core Principle

A skill is not considered verified merely because the user enters it or a resume contains it.

```text
Claimed Skill
     ↓
Assessment
     ↓
Score >= 80%
     ↓
Verified Skill
```

The verified skill profile is the central data entity used by roadmap progression, career analysis, interview context, and ranking.

## Development Workflow

Use spec-driven incremental development.

1. Read the context files.
2. Select one unit from `context/specs/00-build-plan.md`.
3. Read that unit's specification.
4. Implement only that unit.
5. Verify the unit.
6. Update `context/progress-tracker.md`.
7. Move to the next dependency-ready unit.

Do not use broad "build the whole application" prompts.

## Scope Priority

### Mandatory

- Authentication
- Profile
- Roadmap ingestion
- Skill graph/dependencies
- Resources
- Assessment engine
- 80% verification
- Three attempts/month
- Verified skill profile
- Job-description analysis
- Skill-gap analysis
- AI mock interview
- Interview evaluation
- Hiresense score
- Basic leaderboard

### Secondary

- Resume extraction
- Project recommendation
- Cross-domain diagnostics
- Additional ranking views
- Assessment integrity monitoring
- GitHub analysis

### Explicitly Avoid

- Microservices
- Kubernetes
- Kafka
- Custom LLM training
- Video interviews
- Facial/voice emotion detection
- LinkedIn/job scraping
- Blockchain
- Large-scale recommendation infrastructure

## Current Status

See `context/progress-tracker.md`.
