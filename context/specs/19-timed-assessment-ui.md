# Unit 19 Specification — Timed Assessment UI

## Goal

Implement the distraction-minimized React Timed Assessment UI (`frontend/src/components/assessment/TimedAssessmentModal.tsx` and `frontend/src/components/assessment/AssessmentResultView.tsx`) with countdown timer, question pagination, option selection, auto-submission on expiry, and post-submission score review displaying question breakdowns with explanations.

## Dependencies

- Unit 14 (Skill Detail UI)
- Unit 18 (Assessment API)

## Design

1. **Assessment State Machine**:
   - `IDLE` -> `LOADING` -> `IN_TEST` -> `SUBMITTING` -> `RESULT_REVIEW`.

2. **Components (`frontend/src/components/assessment/`)**:
   - `TimedAssessmentModal.tsx`:
     - Distraction-minimized overlay/modal adhering to `ui-context.md`.
     - Live countdown timer with pulse warning when remaining time < 2 minutes.
     - Question progress indicator (e.g., `Question 2 of 5` + progress bar).
     - Option card selectors with keyboard accessibility and visual selected states.
     - "Previous" / "Next" pagination controls and "Submit Assessment" trigger.
     - Auto-submission when the timer expires.
   - `AssessmentResultView.tsx`:
     - Pass (`>= 80%`) vs Fail (`< 80%`) banner with score badge and verification invariant notice.
     - Detailed per-question review showing user choice, correct answer, and technical explanation.
     - Action to return to roadmap, prompting a refresh of user skill states.

3. **Integration**:
   - Integrated with "Take Skill Assessment" in `SkillDetailModal.tsx` and `App.tsx` navigation.

## Invariants Protected

- Answer keys are withheld from the client during testing and revealed only after authoritative server submission.
- Minimum 80% pass threshold is explicitly communicated and celebrated.

## Verification Checklist

- [ ] Starting test launches distraction-minimized testing UI.
- [ ] Timer counts down accurately and triggers submission on expiry.
- [ ] Answer selections persist across question pagination.
- [ ] Submitting answers renders comprehensive result review with score and explanations.
- [ ] Passing (`>= 80%`) marks skill verified and updates roadmap view.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
