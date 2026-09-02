# Unit 13 Specification — Skill State Engine

## Goal

Implement the deterministic Skill State Engine in `backend/src/skills/` to compute and manage user skill states (`LOCKED`, `AVAILABLE`, `IN_PROGRESS`, `VERIFIED`) based on prerequisite satisfaction and backend assessment verification records.

## Dependencies

- Unit 01 through Unit 12 (specifically Unit 06 Profile/User Auth, Unit 08 Roadmap Schema, Unit 10 Roadmap Import Service)

## Design

1. **Types (`backend/src/skills/types.ts`)**:
   - `UserSkillStatus`: `'CLAIMED' | 'UNVERIFIED' | 'VERIFIED'`.
   - `ComputedSkillState`: `'locked' | 'available' | 'in_progress' | 'verified'`.
   - `UserSkillDTO`: Database entity representing user skill record.
   - `UserSkillGraphNode`: Skill node with authoritative computed `userStatus: ComputedSkillState` and prerequisite completion details.
   - `UserRoadmapStateDTO`: Domain, roadmap, nodes with user statuses, and progress summary stats.

2. **Skill State Service (`backend/src/skills/service.ts`)**:
   - `getUserSkills(userId: string)`: Fetches user skills for the given user.
   - `getUserRoadmapState(userId: string, domainSlug: string)`:
     - Fetches roadmap graph nodes from `RoadmapService`.
     - Fetches user's `UserSkill` records.
     - Evaluates prerequisite satisfaction:
       - If user has `status === 'VERIFIED'` for this skill -> `VERIFIED`.
       - If all prerequisite skills are `VERIFIED` by the user (or 0 prereqs) -> `AVAILABLE` (or `IN_PROGRESS` if unverified attempt exists).
       - If any prerequisite skill is NOT `VERIFIED` -> `LOCKED`.
     - Returns personalized roadmap graph with progress metrics.
   - `claimSkill(userId: string, skillId: string)`: Marks skill as `CLAIMED` (Invariant: NEVER sets to `VERIFIED`).
   - `recordVerificationResult(userId: string, skillId: string, score: number)`: Enforces invariant (`score >= 80` -> `VERIFIED`, `score < 80` -> `UNVERIFIED`).

3. **REST API Routes (`backend/src/skills/routes.ts`)**:
   - `GET /api/skills/my-skills`: Authenticated endpoint to fetch user's skills.
   - `GET /api/skills/roadmap/:domainSlug`: Authenticated endpoint returning user's personalized roadmap graph with computed states.
   - `POST /api/skills/claim`: Authenticated endpoint to declare a skill.

4. **Mount in Server (`backend/src/index.ts`)**:
   - Mount `skillsRouter` at `/api/skills`.

5. **Frontend Integration (`frontend/src/lib/roadmapApi.ts`, `frontend/src/components/roadmap/RoadmapView.tsx`)**:
   - When authenticated, fetch personalized roadmap states from `/api/skills/roadmap/:domainSlug`.

## Verification Checklist

- [ ] Unverified skills with unmet prerequisites are computed as `LOCKED`.
- [ ] Skills with all prerequisites verified (or 0 prerequisites) are computed as `AVAILABLE`.
- [ ] Verified skills are computed as `VERIFIED`.
- [ ] Claimed/unverified skills cannot become `VERIFIED` without `score >= 80`.
- [ ] Authenticated endpoints enforce user identification from token.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
