# Unit 15 Specification — Question Schema & Question Bank Model

## Goal

Define the TypeScript domain schema and Question Bank service for managing reusable assessment question pools tied to skills, ensuring strict separation between authoritative internal question records (with answer keys) and client-safe public representations (without answer keys).

## Dependencies

- Unit 03 (Database Baseline / Schema `001_initial_schema.sql`)
- Unit 08 (Roadmap Schema)

## Design

1. **Types (`backend/src/assessment/types.ts`)**:
   - `QuestionDifficulty`: `'beginner' | 'intermediate' | 'advanced'`.
   - `QuestionDTO`: Internal authoritative record (`id`, `questionBankId`, `questionText`, `options`, `correctOptionIndex`, `explanation`, `difficulty`, `createdAt`).
   - `PublicQuestionDTO`: Client-safe DTO omitting `correctOptionIndex` and `explanation`.
   - `QuestionBankDTO`: Question bank metadata (`id`, `skillId`, `title`, `createdAt`).
   - `CreateQuestionDTO`: Input schema for adding questions to a pool.

2. **Question Bank Service (`backend/src/assessment/questionBankService.ts`)**:
   - `createQuestionBank(skillId: string, title: string)`: Creates/upserts a question bank for a skill.
   - `addQuestionsToBank(questionBankId: string, questions: CreateQuestionDTO[])`: Inserts validated questions into a bank.
   - `getQuestionBankBySkillId(skillId: string)`: Retrieves bank for a given skill.
   - `getQuestionsForSkill(skillId: string, includeAnswers?: boolean)`: Retrieves questions for a skill, sanitizing answers unless internal.
   - Pre-seeded initial question banks for foundational software engineering skills.

3. **Invariants Protected**:
   - Answer keys (`correctOptionIndex`) are never sent to the client during question loading.
   - Question banks are tied to valid `skillId` entities.
   - Options must contain at least 2 and at most 6 choices with a valid 0-based `correctOptionIndex`.

## Verification Checklist

- [ ] Question and QuestionBank interfaces defined.
- [ ] `PublicQuestionDTO` strips `correctOptionIndex` and `explanation`.
- [ ] `QuestionBankService` supports creating banks, inserting questions, and retrieving by skill.
- [ ] Initial question pools seeded for core skills.
- [ ] `npm --prefix backend run build` passes with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
