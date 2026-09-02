# Unit 06 Specification — Profile API

## Goal

Provide REST API endpoints for fetching and updating user profiles in `backend/src/users/` with strict server-side ownership enforcement.

## Dependencies

- Unit 01 — Repository and App Skeleton
- Unit 02 — Environment and Supabase Connection
- Unit 03 — Database Baseline
- Unit 04 — Authentication API

## Design

1. **Profile Data Contracts (`backend/src/users/types.ts`)**:
   - `UserProfileDTO`: `id`, `email`, `displayName`, `role`, `institution`, `careerGoal`, `githubUrl`, `linkedinUrl`, `createdAt`, `updatedAt`.
   - `UpdateProfileInput`: Partial profile fields (`displayName`, `institution`, `careerGoal`, `githubUrl`, `linkedinUrl`).
2. **Endpoints (`backend/src/users/routes.ts`)**:
   - `GET /api/users/profile` (Protected): Retrieves current user's profile based on `req.user.id`.
   - `PUT /api/users/profile` (Protected): Updates profile for `req.user.id`.
3. **Security Invariant**:
   - User ID is strictly derived from the authenticated session (`req.user.id`).
   - Clients cannot pass arbitrary user IDs to inspect or mutate another user's profile.

## Verification Checklist

- [ ] `backend/src/users/routes.ts` enforces `requireAuth` on profile endpoints.
- [ ] Server derives user identity exclusively from authenticated token `req.user.id`.
- [ ] `npm --prefix backend run build` passes with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
