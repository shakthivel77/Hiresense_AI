# Unit 35 Specification — AI Response Evaluator

## Goal

Create the AI Response Evaluator (`backend/src/interview/interviewEvaluatorService.ts`) to evaluate candidate verbal or written responses against structured question rubrics (`keySignals`, `antiPatterns`, `idealAnswerOutline`), scoring conceptual clarity, detecting omissions, and generating actionable improvement feedback.

## Dependencies

- Unit 33 (Mock Interview Question Bank)
- Unit 34 (Interview Session Engine)

## Design

1. **Evaluation Models (`backend/src/interview/types.ts`)**:
   - `EvaluationPerformanceTier`: `'EXEMPLARY' | 'PROFICIENT' | 'DEVELOPING' | 'NEEDS_IMPROVEMENT'`.
   - `QuestionEvaluationDTO`:
     - `questionId`: Identifier of the evaluated question.
     - `overallScore`: 0–100 numerical score.
     - `performanceTier`: Evaluation performance tier.
     - `signalsDetected`: Array of rubric key signals successfully exhibited.
     - `missedSignals`: Array of rubric key signals omitted or weakly articulated.
     - `antiPatternsFound`: Array of identified anti-patterns or misconceptions.
     - `strengths`: Bullet points of strong technical or behavioral responses.
     - `areasForImprovement`: Specific guidance to refine depth or structure.
     - `evaluatedAt`: ISO timestamp.
   - `SessionEvaluationDTO`:
     - `sessionId`: Identifier of the evaluated session.
     - `overallScore`: Average score across all answered questions.
     - `performanceTier`: Overall session readiness tier.
     - `questionEvaluations`: Itemized evaluations for each question.
     - `summaryFeedback`: High-level session synthesis.
     - `evaluatedAt`: ISO timestamp.

2. **Evaluator Service (`backend/src/interview/interviewEvaluatorService.ts`)**:
   - Evaluates response text against rubric criteria:
     - Scans for key signal concepts and keywords.
     - Checks for anti-pattern triggers and penalties.
     - Measures depth, precision, and alignment with `idealAnswerOutline`.
     - Computes objective score ($0-100\%$) and maps to performance tier ($\ge 85 \to \text{EXEMPLARY}$, $\ge 70 \to \text{PROFICIENT}$, $\ge 50 \to \text{DEVELOPING}$, $< 50 \to \text{NEEDS\_IMPROVEMENT}$).
   - Generates constructive, encouraging strengths and clear areas for improvement.
   - `evaluateSession`: Aggregates itemized question evaluations into a comprehensive interview session report.

## Invariants Protected

- AI interview evaluation is strictly for interview readiness coaching and feedback; it never alters, grants, or bypasses verified skill status in the Verified Skill Profile.

## Verification Checklist

- [ ] `QuestionEvaluationDTO` and `SessionEvaluationDTO` defined in `types.ts`.
- [ ] `InterviewEvaluatorService` evaluates individual responses and whole sessions against rubrics.
- [ ] Detected signals, missed signals, and anti-patterns are accurately parsed.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
