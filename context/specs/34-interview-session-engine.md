# Unit 34 Specification — Interview Session Engine

## Goal

Implement the Interview Session Engine (`backend/src/interview/interviewSessionService.ts`), managing mock interview session lifecycles (`CONFIGURED` -> `IN_PROGRESS` -> `COMPLETED` / `ABANDONED`), question staging, candidate answer submission, and per-question progression.

## Dependencies

- Unit 33 (Mock Interview Question Bank)

## Design

1. **Session Data Models (`backend/src/interview/types.ts`)**:
   - `InterviewSessionStatus`: `'CONFIGURED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'`.
   - `SessionQuestionStatus`: `'PENDING' | 'ACTIVE' | 'ANSWERED' | 'SKIPPED'`.
   - `InterviewSessionQuestionDTO`:
     - `questionId`: Identifier of the staged question.
     - `orderIndex`: 0-indexed position in the session.
     - `question`: Complete `InterviewQuestionDTO` snapshot (including prompts and rubrics).
     - `candidateResponseText`: Candidate's written or transcribed verbal response.
     - `recordingDurationSeconds`: Time spent answering.
     - `status`: `SessionQuestionStatus`.
     - `answeredAt`: ISO timestamp.
   - `InterviewSessionDTO`:
     - `id`: Unique session ID (`int-sess-XXXXXX`).
     - `userId`: Candidate identifier.
     - `domainSlug`: Track domain.
     - `title`: Session title (e.g. "Backend Systems Mock Interview").
     - `status`: `InterviewSessionStatus`.
     - `currentQuestionIndex`: Pointer to active question.
     - `questions`: `InterviewSessionQuestionDTO[]`.
     - `totalQuestions`, `answeredQuestions`.
     - `startedAt`, `completedAt`, `createdAt`, `updatedAt`.
   - `CreateInterviewSessionInput`:
     - `domainSlug`: string.
     - `title`?: string.
     - `questionCount`?: number (default: 4).
     - `includeBehavioral`?: boolean (default: true).
     - `difficulty`?: `InterviewDifficulty`.

2. **Session Engine Service (`backend/src/interview/interviewSessionService.ts`)**:
   - `createSession(userId, input)`: Selects balanced questions from `interviewQuestionBankService`, stages them, and initializes state.
   - `getSessionById(sessionId)`: Retrieves session with questions.
   - `getUserSessions(userId)`: Lists candidate interview history.
   - `startSession(sessionId)`: Transitions status from `CONFIGURED` to `IN_PROGRESS`.
   - `submitQuestionAnswer(sessionId, questionId, responseText, durationSeconds)`: Records answer, updates question status to `ANSWERED`, advances `currentQuestionIndex`, and completes session if all questions are finished.
   - `skipQuestion(sessionId, questionId)`: Marks question as `SKIPPED` and advances pointer.
   - `abandonSession(sessionId)`: Cancels active session.

## Invariants Protected

- Questions cannot be answered out of order or after a session is completed.
- Session state transitions are deterministic and persistent.

## Verification Checklist

- [ ] `InterviewSessionDTO` and `InterviewSessionQuestionDTO` defined in `types.ts`.
- [ ] `InterviewSessionService` handles session creation, start, question answering, skipping, and completion.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
