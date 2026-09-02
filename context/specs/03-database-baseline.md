# Unit 03 Specification — Database Baseline

## Goal

Create the initial relational database migration script (`database/migrations/001_initial_schema.sql`) defining PostgreSQL schemas, constraints, foreign keys, indexes, and trigger functions for Supabase.

## Dependencies

- Unit 01 — Repository and App Skeleton
- Unit 02 — Environment and Supabase Connection

## Design

1. **Tables**:
   - `profiles` (links to `auth.users`)
   - `domains`, `roadmaps`, `skills`, `skill_dependencies`
   - `user_skills` (stores `CLAIMED`, `UNVERIFIED`, `VERIFIED` status, verification score, attempt count)
   - `question_banks`, `questions`
   - `tests`, `test_attempts`
   - `job_analyses`, `job_requirements`
   - `interview_sessions`, `interview_questions`, `interview_answers`
2. **Indexes**:
   - `idx_user_skills_user_id`, `idx_user_skills_skill_id`
   - `idx_test_attempts_user_skill`
   - `idx_questions_bank`
   - `idx_skill_deps_prereq`
3. **Database Level Invariants**:
   - `passing_score` default 80.0.
   - `status` constraint on `user_skills` (`CLAIMED`, `UNVERIFIED`, `VERIFIED`).
   - Cascade deletes for user-owned dependencies where appropriate.

## Verification Checklist

- [ ] `database/migrations/001_initial_schema.sql` exists and is valid PostgreSQL SQL syntax.
- [ ] Schema enforces 80% default threshold and skill state domain constraints.
- [ ] `database/seeds/001_initial_seeds.sql` exists for basic domain and skill seeding.
- [ ] Build checks pass cleanly in backend and frontend.
- [ ] `context/progress-tracker.md` is updated.
