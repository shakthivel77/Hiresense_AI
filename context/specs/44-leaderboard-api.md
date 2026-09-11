# Unit 44 Specification — Deterministic Hiresense Competency Score & Leaderboard API

## Goal

Implement the **Ranking Service and Leaderboard REST API** (`backend/src/ranking/rankingService.ts` and `backend/src/ranking/routes.ts`), exposing endpoints to calculate individual candidate competency scores and query global, domain-specific, and institution-specific leaderboards.

## Dependencies

- Unit 06 (Profile API)
- Unit 29 (Verified Skill API)
- Unit 43 (Score Components & Normalization)

## Design

### 1. Leaderboard Data Contracts (`backend/src/ranking/types.ts`)

```typescript
export interface LeaderboardEntryDTO {
  rank: number;
  userId: string;
  displayName: string;
  role: string;
  institution?: string | null;
  primaryDomain?: string;
  compositeScore: number;
  tier: CompetencyTier;
  verifiedSkillsCount: number;
  completedInterviewsCount: number;
  avatarUrl?: string | null;
}

export interface LeaderboardQueryFilters {
  scope?: 'global' | 'domain' | 'institution';
  domainSlug?: string;
  institution?: string;
  tier?: CompetencyTier;
  limit?: number;
  offset?: number;
}

export interface LeaderboardResponseDTO {
  scope: string;
  totalEntries: number;
  entries: LeaderboardEntryDTO[];
  userRank?: LeaderboardEntryDTO | null;
  page: number;
  pageSize: number;
}

export interface ScoreDistributionDTO {
  totalScoredCandidates: number;
  averageGlobalScore: number;
  tierDistribution: Record<CompetencyTier, number>;
  topInstitutions: Array<{ institution: string; candidateCount: number; averageScore: number }>;
}
```

### 2. REST Endpoints (`backend/src/ranking/routes.ts`)

- **`GET /api/ranking/my-score`**:
  - Requires authentication (or uses demo candidate context).
  - Fetches the caller's verified skills, active domain progress, and interview records, passing them to `ScoreEngine.calculateCompetencyScore`.
  - Returns `UserCompetencyScoreDTO`.

- **`GET /api/ranking/score/:userId`**:
  - Returns competency score breakdown for a specific candidate.

- **`GET /api/ranking/leaderboard`**:
  - Query parameters: `scope`, `domainSlug`, `institution`, `tier`, `limit`, `offset`.
  - Returns `LeaderboardResponseDTO` sorted deterministically by `compositeScore` descending.

- **`GET /api/ranking/distribution`**:
  - Returns `ScoreDistributionDTO` containing tier counts and aggregate percentiles.

### 3. Server Registration (`backend/src/index.ts`)

- Mount `app.use('/api/ranking', rankingRouter);`.

## Invariants Protected

- Public leaderboard endpoints expose only public profile metadata (`displayName`, `institution`, `role`, `tier`, `compositeScore`) and never private credentials.
- Scores cannot be modified by client requests; all scores are computed server-side via `ScoreEngine`.
- Ties are broken deterministically by verified skill count, then alphabetically.

## Verification Checklist

- [ ] `backend/src/ranking/types.ts` extended with leaderboard DTOs and query filters.
- [ ] `backend/src/ranking/rankingService.ts` implements multi-scope ranking, score caching, and distribution analytics.
- [ ] `backend/src/ranking/routes.ts` provides `/my-score`, `/score/:userId`, `/leaderboard`, and `/distribution`.
- [ ] `backend/src/index.ts` mounts `/api/ranking`.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` compile cleanly with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
