# Unit 43 Specification — Score Components & Normalization

## Goal

Implement the deterministic **Score Components & Normalization Engine** (`backend/src/ranking/scoreEngine.ts` and `backend/src/ranking/types.ts`) following the exact mathematical formula defined in `context/architecture.md`. Every score component is normalized to a deterministic $0 - 100$ scale and weighted into the composite Hiresense Competency Score.

## Dependencies

- Unit 20 (Scoring and Verification Engine)
- Unit 28 (Job Analyzer Match Engine)
- Unit 35 (Interview Evaluation Engine)

## Design

### 1. Mathematical Formula & Weightings

$$\text{Hiresense Score} = (0.40 \times S_{\text{mastery}}) + (0.20 \times S_{\text{difficulty}}) + (0.15 \times S_{\text{coverage}}) + (0.15 \times S_{\text{project}}) + (0.10 \times S_{\text{interview}})$$

1. **Skill Mastery ($40\%$, $S_{\text{mastery}}$)**:
   - Evaluates the average verification score of all verified skills:
   $$S_{\text{mastery}} = \frac{1}{N} \sum_{i=1}^{N} \text{score}_i \quad (\text{if } N > 0, \text{ else } 0)$$
   - Only includes skills with `status === 'VERIFIED'` ($\ge 80\%$).

2. **Skill Difficulty ($20\%$, $S_{\text{difficulty}}$)**:
   - Weights verified skills by their difficulty level:
     - Beginner: weight $= 1.0$
     - Intermediate: weight $= 1.5$
     - Advanced: weight $= 2.0$
   - Normalized to $0 - 100$:
   $$S_{\text{difficulty}} = \frac{\sum w_i}{\max(1, N) \times 2.0} \times 100 \quad (\text{if } N > 0, \text{ else } 0)$$

3. **Domain Coverage ($15\%$, $S_{\text{coverage}}$)**:
   - Ratio of verified skills to total skills in the user's active/enrolled domain(s):
   $$S_{\text{coverage}} = \min\left(100, \frac{N_{\text{verified}}}{N_{\text{domain\_total}}} \times 100\right)$$

4. **Project Performance / Completion ($15\%$, $S_{\text{project}}$)**:
   - Deterministic calculation based on practical application: evaluated from verified advanced/intermediate skill density and project milestone records ($0 - 100$).

5. **Interview Performance ($10\%$, $S_{\text{interview}}$)**:
   - Average score across completed mock interview sessions:
   $$S_{\text{interview}} = \frac{1}{M} \sum_{j=1}^{M} \text{interview\_score}_j \quad (\text{if } M > 0, \text{ else deterministic fallback})$$

### 2. Tier Classifications

| Composite Score | Competency Tier |
|---|---|
| $0.00 - 39.99$ | `NOVICE` |
| $40.00 - 59.99$ | `APPRENTICE` |
| $60.00 - 74.99$ | `PROFICIENT` |
| $75.00 - 89.99$ | `EXPERT` |
| $90.00 - 100.00$ | `MASTER` |

### 3. Data Contracts (`backend/src/ranking/types.ts`)

```typescript
export type CompetencyTier = 'NOVICE' | 'APPRENTICE' | 'PROFICIENT' | 'EXPERT' | 'MASTER';

export interface ScoreComponentBreakdown {
  skillMastery: {
    rawScore: number;
    weight: number; // 0.40
    weightedScore: number;
    verifiedSkillsCount: number;
  };
  skillDifficulty: {
    rawScore: number;
    weight: number; // 0.20
    weightedScore: number;
    difficultyBreakdown: { beginner: number; intermediate: number; advanced: number };
  };
  domainCoverage: {
    rawScore: number;
    weight: number; // 0.15
    weightedScore: number;
    domainSlug: string;
    verifiedInDomain: number;
    totalInDomain: number;
  };
  projectPerformance: {
    rawScore: number;
    weight: number; // 0.15
    weightedScore: number;
  };
  interviewPerformance: {
    rawScore: number;
    weight: number; // 0.10
    weightedScore: number;
    sessionsCount: number;
  };
}

export interface UserCompetencyScoreDTO {
  userId: string;
  compositeScore: number; // 0 - 100, rounded to 2 decimals
  tier: CompetencyTier;
  components: ScoreComponentBreakdown;
  calculatedAt: string;
}
```

## Invariants Protected

- Deterministic and reproducible: the same candidate input always produces the exact same score.
- Every individual score component is strictly clamped to $[0, 100]$.
- Incomplete/unverified skills cannot contribute to $S_{\text{mastery}}$ or $S_{\text{difficulty}}$.

## Verification Checklist

- [ ] `backend/src/ranking/types.ts` defines score breakdown, component models, and tiers.
- [ ] `backend/src/ranking/scoreEngine.ts` implements deterministic component normalization and composite calculation.
- [ ] Unit calculation tests pass with zero deviation from formula weights.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
