# Unit 36 Specification — STAR Method Feedback Formatter

## Goal

Implement the STAR Method Feedback Formatter (`backend/src/interview/starFeedbackFormatterService.ts`), analyzing candidate behavioral responses across Situation, Task, Action, and Result (STAR), diagnosing completeness across each pillar, and generating a structured reformulation of the candidate's answer into a polished STAR narrative.

## Dependencies

- Unit 33 (Mock Interview Question Bank)
- Unit 35 (AI Response Evaluator)

## Design

1. **STAR Data Models (`backend/src/interview/types.ts`)**:
   - `StarPillarType`: `'SITUATION' | 'TASK' | 'ACTION' | 'RESULT'`.
   - `StarPillarPresence`: `'STRONG' | 'ADEQUATE' | 'WEAK' | 'MISSING'`.
   - `StarPillarEvaluationDTO`:
     - `pillar`: `StarPillarType`.
     - `presence`: `StarPillarPresence`.
     - `extractedSnippet`: Extracted excerpt or null.
     - `feedback`: Critique of that component.
     - `suggestedEnhancement`: Specific suggestion to elevate this pillar.
   - `StarFeedbackReportDTO`:
     - `questionId`: string.
     - `pillars`: `Record<'situation' | 'task' | 'action' | 'result', StarPillarEvaluationDTO>`.
     - `starCompletenessScore`: 0–100 percentage.
     - `structuredReformulation`: Formatted model answer structuring the candidate's story into clean STAR bullet points.
     - `formattedAt`: ISO timestamp.

2. **STAR Analysis Engine (`backend/src/interview/starFeedbackFormatterService.ts`)**:
   - Analyzes response text for structural indicators and semantic content for each pillar:
     - **Situation**: Looks for background context, team setup, legacy constraints, systems involved.
     - **Task**: Looks for the specific objective, KPI, target deadline, or bug resolution requirement.
     - **Action**: Identifies concrete personal engineering steps, tools used, trade-offs weighed, and meetings/prototyping conducted.
     - **Result**: Evaluates measurable business/technical outcomes, latency/uptime numbers, team alignment, or post-mortem learnings.
   - Computes `starCompletenessScore`:
     - Weighted average across the 4 pillars (Situation: 20%, Task: 20%, Action: 35%, Result: 25%).
   - Generates `structuredReformulation`:
     - Assembles the candidate's core story into a clear, professional STAR story ready for real interviews.

## Invariants Protected

- Evaluates storytelling and communication clarity; does not bypass or grant verified technical skill badges.

## Verification Checklist

- [ ] `StarFeedbackReportDTO` and `StarPillarEvaluationDTO` defined in `types.ts`.
- [ ] `StarFeedbackFormatterService.formatStarFeedback` analyzes Situation, Task, Action, and Result components.
- [ ] `structuredReformulation` generates clean STAR structured narratives.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
