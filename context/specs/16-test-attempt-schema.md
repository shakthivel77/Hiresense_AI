# Unit 16 Specification — Test/Attempt Schema & Persistence

## Goal

Define the Test definition and Attempt lifecycle schema in `backend/src/assessment/` and implement the `TestService` for creating timed attempts, tracking assigned question IDs, persisting user answers, and evaluating test submissions against authoritative answer keys.

## Dependencies

- Unit 03 (Database Baseline)
- Unit 15 (Question Schema & Question Bank Model)

## Design

1. **Types (`backend/src/assessment/types.ts`)**:
   - `TestDTO`: Defines the test parameters (`id`, `skillId`, `title`, `timeLimitMinutes` = 15, `passingScore` = 80.00).
   - `TestAttemptStatus`: `'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED'`.
   - `UserAnswerSubmission`: `{ questionId: string; selectedOptionIndex: number }`.
   - `TestAttemptDTO`: Authoritative persistence record (`id`, `testId`, `userId`, `skillId`, `questionIds`, `answers`, `score`, `passed`, `status`, `startedAt`, `completedAt`, `expiresAt`).
   - `PublicTestAttemptDTO`: Safe representation sent to the client during an active test.
   - `TestEvaluationResult`: Complete score breakdown returned upon test submission.

2. **Test Service (`backend/src/assessment/testService.ts`)**:
   - `getOrCreateTestForSkill(skillId: string)`: Retrieves or registers the standard test for a skill.
   - `createAttempt(userId: string, skillId: string, questionIds: string[])`: Initializes an `IN_PROGRESS` attempt with a calculated `expiresAt` deadline.
   - `getAttemptById(attemptId: string)`: Retrieves an attempt.
   - `submitAttempt(attemptId: string, userId: string, answers: UserAnswerSubmission[])`:
     - Verifies user ownership of the attempt.
     - Checks if attempt is already completed or expired.
     - Compares submitted answers against authoritative question records.
     - Computes percentage score deterministically.
     - Sets `passed = score >= 80.0`.
     - Updates attempt status to `COMPLETED`.
   - `getUserAttempts(userId: string, skillId?: string)`: Retrieves attempt history for a user.

## Invariants Protected

- Answer keys are checked solely server-side during `submitAttempt`.
- Attempt ownership is strictly enforced against `userId`.
- Passing mark is fixed at `80.0%` by backend logic.
- Time expiration is verified server-side.

## Verification Checklist

- [ ] `TestDTO` and `TestAttemptDTO` types defined.
- [ ] `TestService.createAttempt` creates an active attempt with correct expiration time.
- [ ] `TestService.submitAttempt` scores answers against server-side question bank.
- [ ] Test attempts are persisted with status lifecycle (`IN_PROGRESS` -> `COMPLETED`).
- [ ] `npm --prefix backend run build` passes with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
