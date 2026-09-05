# Unit 38 Specification — Mock Interview UI

## Goal

Create the interactive Mock Interview UI (`frontend/src/components/interview/MockInterviewView.tsx`) providing an immersive practice room with domain/track selection, live question staging, voice recording simulation with timers, text transcription editing, skip/submit progression, and a comprehensive interview performance report with STAR methodology breakdown.

## Dependencies

- Unit 33 (Mock Interview Question Bank)
- Unit 34 (Interview Session Engine)
- Unit 35 (AI Response Evaluator)
- Unit 36 (STAR Method Feedback Formatter)
- Unit 37 (Interview Prep API)

## Design

1. **Setup & Session Config**:
   - Domain track selector (Backend Developer, Frontend Developer, AI & Data Engineer).
   - Difficulty picker, question count, and behavioral question toggle.
   - Past interview sessions drawer/history.

2. **Interactive Practice Room**:
   - Step progress indicator across staged questions.
   - Skill tag and question type pill (`BEHAVIORAL`, `TECHNICAL_DEEP_DIVE`, `SYSTEM_DESIGN`).
   - Clear question prompt with target answer duration timer.
   - Live speech recording simulation with microphone toggle, pulse animation, and speech-to-text transcript typing.
   - Text editing area for refining answers.
   - "Submit Answer & Proceed", "Skip Question", and "Abandon" actions.

3. **Performance Report & STAR Breakdown**:
   - Overall interview readiness score ($0-100\%$) and tier badge (`EXEMPLARY`, `PROFICIENT`, `DEVELOPING`, `NEEDS_IMPROVEMENT`).
   - Executive coaching summary.
   - Itemized question review showing detected key signals, missed concepts, and anti-pattern flags.
   - Detailed STAR methodology card for behavioral questions (Situation, Task, Action, Result completeness, pillar feedback, and polished story reformulation).
   - Direct link to Roadmap skill modules for missed competencies.

4. **Integration (`frontend/src/App.tsx`)**:
   - Connect `<MockInterviewView />` under the `interview` sidebar tab.

## Invariants Protected

- Mock interview practice evaluates candidate communication and interview readiness without directly modifying backend verified skill badges.

## Verification Checklist

- [ ] `MockInterviewView.tsx` created in `frontend/src/components/interview/`.
- [ ] Voice/text practice room with recording timer and staged question progression.
- [ ] Evaluation report modal/screen with rubric signals and STAR reformulation.
- [ ] Connected to `App.tsx` navigation.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
