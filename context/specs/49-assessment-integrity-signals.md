# Unit 49 Specification — Assessment Integrity Signals

## Goal

Implement the **Assessment Integrity & Proctoring Telemetry System** across the frontend timed assessment modal (`frontend/src/components/assessment/`) and backend assessment attempt evaluator (`backend/src/assessment/`), recording client-side tab switching, window focus loss, fullscreen exits, and clipboard activity to compute a verifiable **Integrity Score** $[0, 100]$ alongside assessment answers.

## Dependencies

- Unit 19 (Timed Assessment UI)
- Unit 20 (Scoring and Verification Engine)

## Design

### 1. Data Contracts (`backend/src/assessment/types.ts` & `frontend/src/lib/assessmentApi.ts`)

```typescript
export type IntegrityEventType =
  | 'TAB_SWITCH'
  | 'FOCUS_LOST'
  | 'FULLSCREEN_EXIT'
  | 'CLIPBOARD_COPY'
  | 'CLIPBOARD_PASTE'
  | 'CONTEXT_MENU'
  | 'RAPID_ANSWER';

export interface IntegritySignalEvent {
  id: string;
  eventType: IntegrityEventType;
  timestamp: string;
  durationMs?: number;
  questionIndex?: number;
  details?: string;
}

export interface AssessmentIntegrityReport {
  integrityScore: number; // 0 - 100
  totalViolations: number;
  tabSwitchesCount: number;
  focusLossCount: number;
  fullscreenExitCount: number;
  clipboardActionsCount: number;
  flaggedForReview: boolean;
  events: IntegritySignalEvent[];
}

export interface UserAnswerSubmissionWithIntegrity {
  answers: UserAnswerSubmission[];
  integrityReport: AssessmentIntegrityReport;
}
```

### 2. Client-Side Telemetry Hook & Monitor HUD (`frontend/src/components/assessment/`)

1. **`useAssessmentIntegrity` React Hook**:
   - Listens to `document.addEventListener('visibilitychange')`.
   - Listens to `window.addEventListener('blur')` and `window.addEventListener('focus')`.
   - Listens to `document.addEventListener('fullscreenchange')`.
   - Intercepts `copy`, `paste`, and `contextmenu` events.
   - Maintains an in-memory event timeline with exact timestamps and durations.
   - Triggers real-time warning modal when candidate navigates away.

2. **Integrity Status HUD in `TimedAssessmentModal.tsx`**:
   - Header badge displaying real-time integrity status:
     - `100% Clean` (Green shield)
     - `Warning: 1 Violation` (Amber shield)
     - `Flagged` (Red shield)
   - Real-time notification banner explaining proctoring rules.

### 3. Backend Integrity Evaluator (`backend/src/assessment/testService.ts`)

1. **Deterministic Penalty Deduction**:
   - Base score: $100$
   - Tab switch / window blur: $-15$ points per event
   - Fullscreen exit: $-20$ points per event
   - Clipboard action: $-10$ points per event
   - Minimum integrity score: $0$

2. **Verification Invariant Stamping**:
   - If `integrityScore < 60` or `tabSwitchesCount > 3`, the assessment is flagged (`flaggedForReview = true`).
   - If flagged, **the skill cannot be verified** even if theoretical score $\ge 80\%$, protecting against automated external copy-pasting.

### 4. REST API Endpoint Updates (`backend/src/assessment/routes.ts`)

- **`POST /api/assessment/submit`**:
  - Accepts `UserAnswerSubmissionWithIntegrity` payload containing `integrityReport`.
  - Evaluates both test correctness ($\ge 80\%$) AND integrity score ($\ge 60\%$).

## Verification Checklist

- [ ] `backend/src/assessment/types.ts` extended with integrity signal events and report contracts.
- [ ] `backend/src/assessment/testService.ts` evaluates integrity penalties and prevents verification on compromised attempts.
- [ ] `frontend/src/components/assessment/useAssessmentIntegrity.ts` records tab switches, blur events, and clipboard actions.
- [ ] `frontend/src/components/assessment/TimedAssessmentModal.tsx` displays live integrity HUD and warning banners.
- [ ] Unit test verification proves:
  - Clean attempts with 0 violations maintain 100% integrity score.
  - Excessive tab switching penalizes integrity score and invalidates verification.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` compile cleanly.
- [ ] `context/progress-tracker.md` updated.
