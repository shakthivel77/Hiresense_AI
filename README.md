# Hiresense_AI

Hiresense_AI is an AI-enabled competency and career-readiness platform for computer-science and software-engineering learners.

The system combines:

**Roadmap → Skill Graph → Learning → Assessment → Verification → Competency Profile → Career Gap Analysis → Interview → Readiness Score**

## Repository Structure

```text
Hiresense_AI/
├── CLAUDE.md
├── README.md
├── context/
│   ├── project-overview.md
│   ├── architecture.md
│   ├── code-standards.md
│   ├── ai-workflow-rules.md
│   ├── ui-context.md
│   ├── progress-tracker.md
│   └── specs/
│       ├── 00-build-plan.md
│       └── 01-repository-skeleton.md
├── frontend/
├── backend/
└── database/
```

## Repository Context

The `context/` directory is the source of truth for project intent, architecture, implementation rules, UI conventions, workflow, and current progress.

Read these before implementation:
1. `CLAUDE.md` — Entry point & Master Instructions
2. `context/project-overview.md` — Product definition & goals
3. `context/architecture.md` — Modular monolith architecture & invariants
4. `context/ui-context.md` — UI design tokens & layout guidelines
5. `context/code-standards.md` — Code rules, TypeScript, Express, React, & testing standards
6. `context/ai-workflow-rules.md` — Spec-driven workflow & verification rules
7. `context/progress-tracker.md` — Current phase & execution state
8. `context/specs/00-build-plan.md` — Master implementation roadmap

## Project Constraints

- **Team**: 3 members
- **Remaining time**: ~55 days
- **Budget**: Zero
- **Project type**: University final-year project
- **Architecture**: Modular monolith
- **Database**: PostgreSQL through Supabase
- **Authentication**: Supabase Auth
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express.js + TypeScript
- **AI**: Replaceable free/available model provider through `AIService`

## Core Invariant

A skill is NOT verified merely because the user enters it or a resume contains it.

```text
Claimed Skill → Assessment → Backend Scoring (Score >= 80%) → Verified Skill
```

The verified skill profile is the central data entity used by roadmap progression, career analysis, interview context, and ranking.

## Status

See `context/progress-tracker.md` for current implementation phase and task breakdown.
