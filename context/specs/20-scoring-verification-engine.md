# Unit 20 Specification — Scoring and Verification Engine

## Goal

Formalize the Scoring & Verification Engine by implementing the Verified Skill Profile aggregation service in `backend/src/skills/` and exposing `GET /api/skills/verified-profile`, computing cross-domain verified competencies, verification rates, and domain progression badges based on the strict `>= 80%` assessment scoring invariant.

## Dependencies

- Unit 13 (Skill State Engine)
- Unit 16 (Test/Attempt Schema)
- Unit 18 (Assessment API)

## Design

1. **Profile Types (`backend/src/skills/types.ts`)**:
   - `VerifiedSkillItemDTO`: `{ skillId, skillName, category, difficulty, verificationScore, verificationDate }`.
   - `DomainProgressDTO`: `{ domainSlug, domainTitle, verifiedCount, totalCount, completionPercentage }`.
   - `VerifiedSkillProfileDTO`: `{ userId, totalVerifiedSkills, totalClaimedSkills, verificationRate, verifiedSkills, domainBreakdown }`.

2. **Skill Service Aggregation (`backend/src/skills/service.ts`)**:
   - `getVerifiedSkillProfile(userId: string)`:
     - Aggregates all user skills with status `VERIFIED`.
     - Cross-references roadmap domains to compute domain progress.
     - Computes overall verification percentage.

3. **REST Endpoint (`backend/src/skills/routes.ts`)**:
   - `GET /api/skills/verified-profile`: Protected endpoint returning `VerifiedSkillProfileDTO`.

4. **Frontend Integration**:
   - Client helper `fetchVerifiedSkillProfile` in `frontend/src/lib/skillsApi.ts`.
   - Integration in Dashboard/Profile views.

## Invariants Protected

- Skills can ONLY reach `VERIFIED` status through server-verified assessment score `>= 80%`.
- Claimed skills remain `UNVERIFIED` until an assessment is passed.
- All verified skills are reusable across domains.

## Verification Checklist

- [ ] `VerifiedSkillProfileDTO` interface defined.
- [ ] `SkillService.getVerifiedSkillProfile` aggregates verified skills and domain statistics.
- [ ] `GET /api/skills/verified-profile` returns verified skill stats.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
