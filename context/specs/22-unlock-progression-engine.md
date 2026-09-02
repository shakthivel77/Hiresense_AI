# Unit 22 Specification — Unlock Progression Engine

## Goal

Finalize Phase 2 (Assessment Engine) by implementing cascade unlock progression and returning newly unlocked downstream competencies upon successful skill verification (`>= 80%`), reflecting immediate DAG unlocking in both the backend and assessment UI.

## Dependencies

- Unit 13 (Skill State Engine)
- Unit 16 (Test/Attempt Schema & Persistence)
- Unit 18 (Assessment API)
- Unit 19 (Timed Assessment UI)
- Unit 20 (Scoring & Verification Engine)

## Design

1. **Cascade Unlock Detection (`backend/src/skills/service.ts`)**:
   - `getNewlyUnlockedSkills(userId: string, justVerifiedSkillId: string)`:
     - Retrieves all roadmap dependency edges.
     - Identifies skills that directly depend on `justVerifiedSkillId`.
     - Checks if all other prerequisites for those dependent skills are already satisfied (`status === 'VERIFIED'`).
     - Returns metadata (`id`, `name`, `category`) for all skills newly transitioned to `AVAILABLE`.

2. **Integration in Assessment Submission (`backend/src/assessment/testService.ts`)**:
   - In `submitAttempt`, when `passed === true`, triggers `getNewlyUnlockedSkills` and attaches them to `TestEvaluationResult`.

3. **UI Celebration (`frontend/src/components/assessment/AssessmentResultView.tsx`)**:
   - If `newlyUnlockedSkills` are present in the submission result, displays a celebratory "Unlocked Competencies" card with direct visual badges.

## Invariants Protected

- Unlocking is strictly deterministic: dependent skills only unlock when 100% of direct prerequisites have authoritative verified score `>= 80%`.
- Cross-domain prerequisite resolution is maintained.

## Verification Checklist

- [ ] `SkillService.getNewlyUnlockedSkills` computes newly available skills after verification.
- [ ] `submitAttempt` returns `newlyUnlockedSkills` on passing attempts.
- [ ] `AssessmentResultView` displays newly unlocked skills.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated marking Phase 2 as COMPLETE.
