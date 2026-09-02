# Unit 18 Specification — Assessment API

## Goal

Expose the server-side REST API in `backend/src/assessment/routes.ts` for managing the complete assessment test lifecycle: initiating timed attempts with sanitized questions, querying active attempt status, submitting answers for authoritative scoring, and retrieving user attempt history.

## Dependencies

- Unit 04 (Authentication API & `requireAuth` middleware)
- Unit 13 (Skill State Engine)
- Unit 15 (Question Schema)
- Unit 16 (Test/Attempt Schema & Persistence)
- Unit 17 (Question Selection Service)

## Design

1. **Express Router (`backend/src/assessment/routes.ts`)**:
   - `POST /api/assessment/start`:
     - Protected by `requireAuth`.
     - Request body: `{ skillId: string, questionCount?: number }`.
     - Validates that the requested skill is unlocked for the user.
     - Selects randomized questions using `questionSelectionService.selectQuestionsForTest`.
     - Creates timed attempt via `testService.createAttempt`.
     - Returns sanitized `PublicTestAttemptDTO` and `PublicQuestionDTO[]` (no answer keys exposed).
   - `GET /api/assessment/attempt/:attemptId`:
     - Protected by `requireAuth`.
     - Verifies attempt ownership (`userId`).
     - Returns active attempt state, remaining time window, and sanitized questions.
   - `POST /api/assessment/submit`:
     - Protected by `requireAuth`.
     - Request body: `{ attemptId: string, answers: Array<{ questionId: string, selectedOptionIndex: number }> }`.
     - Verifies ownership and deadline validity.
     - Calls `testService.submitAttempt` to compute authoritative score and record verification.
     - Returns `TestEvaluationResult` with detailed explanations.
   - `GET /api/assessment/history`:
     - Protected by `requireAuth`.
     - Optional query param `?skillId=...`.
     - Returns past attempt records.

2. **Server Mount (`backend/src/index.ts`)**:
   - Mount `assessmentRouter` at `/api/assessment`.

## Invariants Protected

- Answer keys are never included in `POST /api/assessment/start` or `GET /api/assessment/attempt/:attemptId`.
- Scoring and pass determination (>= 80%) take place exclusively on the server.
- All mutations enforce authenticated user ownership.

## Verification Checklist

- [ ] `POST /api/assessment/start` returns 201 with timed attempt and questions without answer keys.
- [ ] `GET /api/assessment/attempt/:attemptId` enforces user ownership and returns active attempt details.
- [ ] `POST /api/assessment/submit` calculates correct score and updates attempt status to `COMPLETED`.
- [ ] Passing score (>= 80%) updates skill verification in `SkillService`.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
