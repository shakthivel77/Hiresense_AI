# Unit 21 Specification — Attempt Limit Enforcement

## Goal

Enforce and visually communicate the invariant that a skill assessment can be attempted at most **3 times per calendar month**, providing real-time attempt tracking, monthly reset countdowns, and clear learning guidance when limits are reached.

## Dependencies

- Unit 16 (Test/Attempt Schema & Persistence)
- Unit 18 (Assessment API)
- Unit 19 (Timed Assessment UI)
- Unit 20 (Scoring and Verification Engine)

## Design

1. **Attempt Calculation Engine (`backend/src/assessment/routes.ts`)**:
   - `GET /api/assessment/attempts-status/:skillId`:
     - Protected by `requireAuth`.
     - Queries all completed test attempts for `(userId, skillId)` within the current calendar month.
     - Computes `attemptsUsedThisMonth`, `attemptsRemaining = max(0, 3 - attemptsUsedThisMonth)`, `canAttempt = attemptsRemaining > 0`.
     - Calculates `nextResetDate` (00:00:00 UTC of the 1st day of next calendar month) and `daysUntilReset`.
     - Returns recent attempt history for that skill.

2. **Frontend Assessment Status Client (`frontend/src/lib/assessmentApi.ts`)**:
   - `fetchSkillAttemptStatus(skillId: string, token: string)`: Retrieves the attempt status.

3. **UI Feedback (`frontend/src/components/roadmap/SkillDetailModal.tsx`)**:
   - Renders interactive monthly attempt meter (`3-pips indicator`).
   - Displays remaining attempts (e.g. `2 of 3 attempts remaining in September`).
   - Displays next reset countdown (e.g. `Resets in 29 days on Oct 1`).
   - Disables test initiation and provides clear study advice when 3 attempts have been exhausted.

## Invariants Protected

- Strictly caps skill assessment attempts to a maximum of 3 per calendar month.
- Server rejects unauthorized attempts (`429 ATTEMPT_LIMIT_EXCEEDED`).
- Monthly reset calculations are deterministic based on UTC calendar months.

## Verification Checklist

- [ ] `GET /api/assessment/attempts-status/:skillId` returns attempt counts and reset timestamps.
- [ ] Attempt meter reflects real-time attempt usage.
- [ ] Exhausting 3 attempts disables test initiation.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
