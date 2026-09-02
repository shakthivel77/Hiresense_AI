# Unit 30 Specification — Gap Analysis Engine

## Goal

Implement the Career Gap Analysis Engine (`backend/src/career/jobGapEngine.ts`), analyzing missing competencies identified by the match engine, traversing the prerequisite dependency DAG from the roadmap engine, calculating score gain potentials, and generating prioritized, actionable learning and assessment recommendations.

## Dependencies

- Unit 13 (Skill State Engine & DAG)
- Unit 29 (Deterministic Match Engine)

## Design

1. **Gap Analysis Models (`backend/src/career/types.ts`)**:
   - `GapPriority`: `'IMMEDIATE_QUICK_WIN' | 'HIGH_PRIORITY' | 'MEDIUM_PRIORITY' | 'LOW_PRIORITY'`.
   - `PrerequisiteStepDTO`: `skillId`, `skillName`, `category`, `isVerified`, `status` (`VERIFIED`, `AVAILABLE`, `LOCKED`).
   - `SkillGapRecommendationDTO`:
     - `skillId`, `skillName`, `category`, `importance`, `weight`.
     - `scorePotentialGain`: Percentage points increase upon verifying this skill.
     - `priority`: Categorized priority tier.
     - `isReadyToAssess`: Boolean indicating whether all direct prerequisites are met (immediate quick win).
     - `missingPrerequisiteCount`: Number of unverified upstream prerequisites.
     - `prerequisiteChain`: Full ordered dependency path to reach competency.
     - `domainSlug`, `roadmapUrl`, `actionTip`.
   - `CareerGapAnalysisDTO`:
     - `jobMatch`: Underlying match analysis.
     - `totalGapsCount`, `quickWinsCount`, `blockedGapsCount`.
     - `recommendations`: Sorted array of recommendations.
     - `generatedAt`: ISO timestamp.

2. **DAG Traversal & Score Potential Algorithms (`backend/src/career/jobGapEngine.ts`)**:
   - For each missing skill in `jobMatch.missingSkills`:
     - Retrieves prerequisites from `roadmapService.getDependencies()`.
     - Recursively collects the prerequisite chain.
     - Evaluates whether candidate has verified each prerequisite in the chain.
     - Calculates `scorePotentialGain = Math.round((weight * 1.0 / totalJobWeight) * 100)`.
     - Assigns `priority`:
       - If `isReadyToAssess && importance === 'REQUIRED'` -> `'IMMEDIATE_QUICK_WIN'`.
       - If `importance === 'REQUIRED' && missingPrereqs <= 1` -> `'HIGH_PRIORITY'`.
       - If `importance === 'REQUIRED'` -> `'MEDIUM_PRIORITY'`.
       - If `importance === 'PREFERRED'` -> `'LOW_PRIORITY'`.
     - Sorts recommendations: Quick Wins first, followed by High Priority, Medium Priority, and Low Priority.

## Invariants Protected

- Recommendations are grounded strictly in the roadmap graph; prerequisite chains reflect the true DAG structure.
- Score gain potentials sum accurately to the gap between current match score and 100%.

## Verification Checklist

- [ ] `CareerGapAnalysisDTO` and `SkillGapRecommendationDTO` defined in `types.ts`.
- [ ] `JobGapEngine.generateGapAnalysis` identifies missing prerequisites and calculates score gains.
- [ ] Quick wins (ready-to-assess skills) are prioritized first.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
