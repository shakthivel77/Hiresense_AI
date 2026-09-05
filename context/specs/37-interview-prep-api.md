# Unit 37 Specification — Interview Prep API

## Goal

Create the REST API endpoints in `backend/src/interview/routes.ts` mounted at `/api/interview` to support interview question retrieval, session creation, staged answer submission, question skipping, session cancellation, rubric-based evaluation, and STAR feedback generation.

## Dependencies

- Unit 33 (Mock Interview Question Bank)
- Unit 34 (Interview Session Engine)
- Unit 35 (AI Response Evaluator)
- Unit 36 (STAR Method Feedback Formatter)

## Design

1. **REST Endpoints (`backend/src/interview/routes.ts`)**:
   - `GET /api/interview/questions`: Query questions by domain, type, or difficulty.
   - `GET /api/interview/questions/:questionId`: Retrieve a single interview question.
   - `POST /api/interview/sessions`: Initialize a new staged interview session.
   - `GET /api/interview/sessions`: List user's historical interview sessions.
   - `GET /api/interview/sessions/:sessionId`: Fetch session status and current question.
   - `POST /api/interview/sessions/:sessionId/answer`: Submit answer for active question (`SubmitAnswerInput`).
   - `POST /api/interview/sessions/:sessionId/skip`: Skip the active question.
   - `POST /api/interview/sessions/:sessionId/abandon`: Cancel session.
   - `POST /api/interview/sessions/:sessionId/evaluate`: Generate comprehensive session rubric & STAR evaluation (`SessionEvaluationDTO`).
   - `POST /api/interview/evaluate-answer`: Test/evaluate an answer against a question directly on the fly (`QuestionEvaluationDTO`).

2. **Server Mount (`backend/src/index.ts`)**:
   - Mount `interviewRouter` at `/api/interview`.

3. **Frontend API Client (`frontend/src/lib/interviewApi.ts`)**:
   - Client functions wrapping all endpoints with full TypeScript definitions.

## Invariants Protected

- All scoring and STAR formatting logic remains exclusively server-side.
- Mock interview evaluations provide preparation feedback without granting or altering verified skill badges.

## Verification Checklist

- [ ] `interviewRouter` implements question querying, session lifecycle, answer submission, and evaluation.
- [ ] Router mounted at `/api/interview` in `backend/src/index.ts`.
- [ ] `frontend/src/lib/interviewApi.ts` created with typed client methods.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
