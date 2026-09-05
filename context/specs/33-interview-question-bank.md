# Unit 33 Specification — Mock Interview Question Bank

## Goal

Create the Mock Interview Question Bank and schema (`backend/src/interview/types.ts` & `backend/src/interview/interviewQuestionBankService.ts`) providing structured behavioral, technical deep-dive, and system design questions mapped to canonical roadmap skills with detailed evaluation rubrics.

## Dependencies

- Unit 08 (Roadmap Internal Schema)
- Unit 15 (Question Schema & Validation)

## Design

1. **Interview Question Types (`backend/src/interview/types.ts`)**:
   - `InterviewQuestionType`: `'BEHAVIORAL' | 'TECHNICAL_DEEP_DIVE' | 'SYSTEM_DESIGN' | 'PROBLEM_SOLVING'`.
   - `InterviewDifficulty`: `'beginner' | 'intermediate' | 'advanced'`.
   - `InterviewRubricCriteria`:
     - `keySignals`: Expected strengths and concepts.
     - `antiPatterns`: Weak signals and misconceptions.
     - `idealAnswerOutline`: Bullet points of high-scoring responses (STAR framework for behavioral, architecture trade-offs for technical).
     - `sampleFollowUpQuestions`: Follow-up probes for deeper evaluation.
   - `InterviewQuestionDTO`:
     - `id`, `type`, `skillId`, `domainSlug`, `title`, `prompt`, `difficulty`, `expectedTimeSeconds`, `rubric`, `tags`.

2. **Question Bank Service (`backend/src/interview/interviewQuestionBankService.ts`)**:
   - High-quality seed questions mapped across:
     - **Backend Track**: Relational DB indexing & transactions, REST vs GraphQL API design, Auth & JWT security, Redis caching strategies, Docker containerization.
     - **Frontend Track**: React component lifecycle & memoization, Web performance & Core Web Vitals, CSS Grid vs Flexbox responsive layout, State management trade-offs.
     - **AI & Data Track**: Model overfitting mitigation & regularisation, PyTorch training pipelines, Data warehouse ETL vs ELT, LLM RAG architectures.
     - **Behavioral Track**: Conflict resolution, technical debt communication, incident post-mortem (STAR method).
   - Methods:
     - `getAllQuestions()`: Retrieve all questions.
     - `getQuestionById(id)`: Look up single question.
     - `getQuestionsByDomain(domainSlug, options)`: Filter by domain and difficulty.
     - `selectQuestionsForInterview(params)`: Balanced selection of behavioral + technical deep-dives for a mock interview session.

## Invariants Protected

- Questions are strictly tied to canonical roadmap skills without synthetic orphan identifiers.
- Every question includes structured rubrics so that future AI/evaluator scoring (Units 34-36) is objective and grounded.

## Verification Checklist

- [ ] `InterviewQuestionDTO` and `InterviewRubricCriteria` defined in `types.ts`.
- [ ] `InterviewQuestionBankService` seeds behavioral, technical, and system design questions with full rubrics.
- [ ] Balanced interview question selection returns structured session question lists.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
