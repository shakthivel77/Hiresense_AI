# Unit 29 Specification — Deterministic Match Engine

## Goal

Implement the mathematical, deterministic Job Match Engine (`backend/src/career/jobMatchEngine.ts`) calculating exact candidate readiness scores against job postings based exclusively on verified skills (score `>= 80%`), enforcing the system invariant that AI never calculates or alters match percentages.

## Dependencies

- Unit 20 (Scoring & Verification Engine)
- Unit 23 (Verification Artifact Model)
- Unit 28 (Job Posting Schema & Extractor Model)

## Design

1. **Match Models (`backend/src/career/types.ts`)**:
   - `SkillMatchStatus`: `'VERIFIED' | 'CLAIMED' | 'MISSING'`.
   - `ReadinessTier`: `'HIGH' | 'MODERATE' | 'LOW' | 'DEVELOPING'`.
   - `MatchedSkillItem`:
     - `skillId`, `skillName`, `category`, `importance`, `weight`, `status`, `isVerified`, `verificationScore`, `proofId`, `earnedWeight`.
   - `JobMatchAnalysisDTO`:
     - `matchScore`: Overall weighted match percentage ($0.0 - 100.0\%$).
     - `requiredMatchScore`: Required skills match percentage.
     - `preferredMatchScore`: Preferred skills match percentage.
     - `requiredSkillsTotal`, `requiredSkillsMet`.
     - `preferredSkillsTotal`, `preferredSkillsMet`.
     - `readinessTier`: High ($\ge 80\%$), Moderate ($60 - 79\%$), Low ($40 - 59\%$), Developing ($< 40\%$).
     - `matchedSkills`: Array of verified or claimed requirements.
     - `missingSkills`: Array of unmet requirements.
     - `analyzedAt`: ISO timestamp.

2. **Deterministic Mathematical Formulas (`backend/src/career/jobMatchEngine.ts`)**:
   - Required Skill Weight: $W_{\text{req}} = 1.0$.
   - Preferred Skill Weight: $W_{\text{pref}} = 0.5$.
   - For each requirement $i$:
     - If candidate has `status === 'VERIFIED'`, $\text{earned}_i = W_i \times (\text{score}_i / 100)$.
     - Otherwise, $\text{earned}_i = 0.0$.
   - Overall Match Score:
     $$\text{Match Score} = \left( \frac{\sum \text{earned}_i}{\sum W_i} \right) \times 100$$
   - Required Match Score:
     $$\text{Required Match Score} = \left( \frac{\sum_{\text{req}} \text{earned}_i}{\sum_{\text{req}} W_i} \right) \times 100$$

3. **Match Engine API**:
   - `calculateJobMatch(userId: string, jobPosting: JobPostingDTO): Promise<JobMatchAnalysisDTO>`.
   - `calculateMatchFromText(userId: string, rawText: string, domainSlug?: string): Promise<JobMatchAnalysisDTO>`.

## Invariants Protected

- Match score calculation is strictly deterministic, mathematical, and non-hallucinated.
- Claimed and unverified skills earn $0.0$ towards the verified match score.

## Verification Checklist

- [ ] `JobMatchAnalysisDTO` and `MatchedSkillItem` defined in `types.ts`.
- [ ] `JobMatchEngine.calculateJobMatch` evaluates candidate skills against job requirements.
- [ ] Verified skills earn proportional weight; missing/unverified earn 0.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
