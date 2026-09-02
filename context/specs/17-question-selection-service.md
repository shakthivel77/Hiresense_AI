# Unit 17 Specification — Question Selection Service

## Goal

Implement `QuestionSelectionService` in `backend/src/assessment/` to perform server-side randomized, balanced selection of questions from reusable question pools for test attempts.

## Dependencies

- Unit 15 (Question Schema & Question Bank Model)
- Unit 16 (Test/Attempt Schema & Persistence)

## Design

1. **Service (`backend/src/assessment/questionSelectionService.ts`)**:
   - `selectQuestionsForTest(skillId: string, requestedCount = 5)`:
     - Fetches eligible question pool for `skillId` via `questionBankService`.
     - Shuffles questions using a cryptographic/Fisher-Yates randomizer.
     - Balances across difficulty levels (`beginner`, `intermediate`, `advanced`) when available.
     - Returns an array of selected `QuestionDTO` records (and their IDs) for attempt creation.
   - `ensureQuestionPool(skillId: string)`: Ensures an active question pool exists for the skill, generating standard baseline questions if empty.

2. **Invariants Protected**:
   - Randomization is performed strictly on the backend.
   - The frontend cannot predict or manipulate the subset of questions selected.
   - Reusable question pools are reused rather than regenerated on every attempt.

## Verification Checklist

- [ ] `QuestionSelectionService.selectQuestionsForTest` returns random questions for a skill.
- [ ] Multiple consecutive calls produce randomized selections without mutating the base pool.
- [ ] Client cannot control question selection parameters.
- [ ] `npm --prefix backend run build` passes with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
