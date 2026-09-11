# Unit 45 Specification — Leaderboard & Readiness UI

## Goal

Implement the **Leaderboard & Readiness UI** (`frontend/src/components/ranking/`), providing candidates with an interactive, rich interface to inspect their deterministic competency score breakdown, navigate global/domain/institution leaderboards with real-time filters, explore aggregate score distributions across tiers, and view peer profiles.

## Dependencies

- Unit 43 (Score Components & Normalization)
- Unit 44 (Deterministic Hiresense Competency Score & Leaderboard API)
- Unit 06 (Profile API)
- Unit 29 (Verified Skill API)

## Design

### 1. Component Architecture

```text
frontend/src/components/ranking/
├── types.ts                   # Re-exports & UI view state types
├── ScoreOverviewCard.tsx      # Personal 5-component competency HUD & tier badge
├── LeaderboardFilters.tsx     # Scope toggle (Global/Domain/Institution), search & tier filters
├── LeaderboardTable.tsx       # Ranked candidate table with medal badges & tier indicators
├── DistributionAnalytics.tsx  # Tier distribution bars, top institutions & domain averages
├── CandidateScoreModal.tsx    # Detailed candidate score inspection modal
├── LeaderboardView.tsx        # Main view coordinating data fetching and state
└── index.ts                   # Clean public exports
```

### 2. Key UI Features

1. **Competency Score Overview Card**:
   - Displays candidate's overall composite score $[0, 100]$ and tier badge (`MASTER`, `EXPERT`, `PROFICIENT`, `APPRENTICE`, `NOVICE`).
   - Visual progress bars for all 5 weighted components:
     - Skill Mastery ($40\%$)
     - Difficulty Multipliers ($20\%$)
     - Domain Curriculum Coverage ($15\%$)
     - Project Portfolio Performance ($15\%$)
     - Mock Interview Readiness ($10\%$)
   - Expandable breakdown explaining the deterministic formula and verifiable authenticity.

2. **Multi-Scope Leaderboard & Filter Bar**:
   - Scope tabs: **Global All-Stars**, **Domain Leaderboards** (Backend, Frontend, AI/Data), **Institution Leaderboards**.
   - Tier filter pills (`ALL`, `MASTER`, `EXPERT`, `PROFICIENT`, `APPRENTICE`, `NOVICE`).
   - Real-time search by candidate name, institution, or domain.
   - User ranking quick-jump banner.

3. **Ranked Candidate Table**:
   - Medal accents for Top 3 (#1 Gold, #2 Silver, #3 Bronze).
   - Display name, avatar/initials, institution, primary domain, tier badge, verified skills count, and composite score.
   - "Inspect Score" action opening candidate component breakdown modal.

4. **Aggregate Distribution Analytics**:
   - Global average score metric and total evaluated candidates.
   - Tier frequency distribution progress bars.
   - Top performing institutions leaderboard and domain averages.

### 3. Invariants Protected

- Public candidate data displayed adheres strictly to verified metrics; unverified self-claims never contribute to rankings.
- Tier classifications match the deterministic thresholds ($\ge 90 \to \text{MASTER}, \ge 75 \to \text{EXPERT}, \ge 60 \to \text{PROFICIENT}, \ge 40 \to \text{APPRENTICE}, < 40 \to \text{NOVICE}$).
- Dynamic sorting ensures zero discrepancies between client tables and server rankings.

## Verification Checklist

- [ ] `frontend/src/components/ranking/ScoreOverviewCard.tsx` renders personal 5-component breakdown and tier badge.
- [ ] `frontend/src/components/ranking/LeaderboardTable.tsx` displays ranked candidates with medal styling, tier badges, and search/filtering.
- [ ] `frontend/src/components/ranking/DistributionAnalytics.tsx` visualizes tier frequencies and institution benchmarks.
- [ ] `frontend/src/components/ranking/CandidateScoreModal.tsx` allows deep inspection of any candidate's weighted metrics.
- [ ] `frontend/src/components/ranking/LeaderboardView.tsx` integrated in `frontend/src/App.tsx`.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` compile cleanly with zero errors.
- [ ] `context/progress-tracker.md` updated to mark Unit 45 and Phase 7 as completed.
