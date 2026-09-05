# Unit 32 Specification — Job Match & Gap UI

## Goal

Create the interactive Job Match & Career Gap UI (`frontend/src/components/career/JobAnalyzerView.tsx`) to enable candidates to select benchmark jobs or paste custom job descriptions, compute deterministic match scores, review itemized verified vs claimed vs missing competencies, and follow prioritized roadmap action bridges.

## Dependencies

- Unit 28 (Job Posting Schema & Extractor Model)
- Unit 29 (Deterministic Match Engine)
- Unit 30 (Gap Analysis Engine)
- Unit 31 (Job Analyzer API)

## Design

1. **Job Analyzer View (`frontend/src/components/career/JobAnalyzerView.tsx`)**:
   - **Split Screen / Dual View Layout**:
     - **Job Input Section**:
       - Pre-loaded benchmark job cards (Backend, Frontend, AI Engineer) for instant one-click analysis.
       - Custom job description editor (Title, Company, Domain selector, text area).
       - "Analyze Match & Roadmap Gaps" action button with live loading state.
     - **Analysis Results Dashboard**:
       - **Readiness Score Banner**: High-contrast score pill ($0-100\%$) styled with tier tokens (`HIGH`, `MODERATE`, `LOW`, `DEVELOPING`), required vs. preferred sub-meters.
       - **Quick Wins Callout**: Highlight banner showing immediately assessable skills and potential $+\Delta\%$ score improvements.
       - **Actionable Gap Recommendations**: Priority-sorted cards (`IMMEDIATE_QUICK_WIN`, `HIGH_PRIORITY`, etc.) with prerequisite dependency chains and "Open in Roadmap" bridge links.
       - **Requirement Match Matrix**: Itemized breakdown showing status (`VERIFIED` with score and proof ID, `CLAIMED` reminder, or `MISSING`).
   - **Roadmap Bridge Integration**:
     - Seamless callback `onNavigateToSkill(domainSlug, skillId)` to transition users directly into the Roadmap View and open the target skill modal.

2. **Navigation Integration (`frontend/src/App.tsx`)**:
   - Mount `JobAnalyzerView` under the `jobs` view tab in `App.tsx`.
   - Enable cross-view navigation between Job Analyzer and Roadmap.

## Invariants Protected

- UI strictly reflects authoritative backend match percentages without client-side artificial inflations.
- Claimed skills display distinct warning badges and contribute 0 towards verified match.

## Verification Checklist

- [ ] `JobAnalyzerView.tsx` and supporting cards created in `frontend/src/components/career/`.
- [ ] Benchmark job selection and custom job analysis compute and display match scores.
- [ ] Quick wins and prioritized gap recommendations display prerequisite chains and score gains.
- [ ] Navigation from gap recommendations to the roadmap view works smoothly.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated marking Phase 4 as COMPLETE.
