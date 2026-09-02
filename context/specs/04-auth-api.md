# Unit 04 Specification — Authentication API

## Goal

Provide server-side authentication verification using Supabase Auth JWT tokens. Provide a reusable `requireAuth` Express middleware that validates incoming bearer tokens and attaches the authenticated user identity to request handlers.

## Dependencies

- Unit 01 — Repository and App Skeleton
- Unit 02 — Environment and Supabase Connection
- Unit 03 — Database Baseline

## Design

1. **Express Auth Middleware (`backend/src/auth/middleware.ts`)**:
   - Extracts `Authorization: Bearer <token>` from HTTP headers.
   - Validates token against Supabase Auth using `supabase.auth.getUser(token)`.
   - Rejects unauthenticated or invalid tokens with HTTP 401 Unauthorized.
   - Attaches `req.user` (`{ id, email }`) to the Express Request object.
2. **Auth API Routes (`backend/src/auth/routes.ts`)**:
   - `GET /api/auth/me` (Protected): Returns current authenticated user session data.
3. **TypeScript Types (`backend/src/auth/types.ts`)**:
   - Interface `AuthenticatedUser` containing `id` (UUID) and `email`.
   - Augments Express `Request` type with `user?: AuthenticatedUser`.

## Implementation Steps

1. Create `backend/src/auth/types.ts` defining user and request interfaces.
2. Create `backend/src/auth/middleware.ts` implementing `requireAuth`.
3. Create `backend/src/auth/routes.ts` mounting `/api/auth/me`.
4. Export auth routes and middleware from `backend/src/auth/index.ts`.
5. Register `/api/auth` router in `backend/src/index.ts`.
6. Verify TypeScript build.
7. Update `context/progress-tracker.md`.

## Explicit Scope Exclusions

Do NOT implement:
- Frontend Auth UI forms (Unit 05)
- User profile CRUD (Unit 06)

## Verification Checklist

- [ ] `requireAuth` middleware compiles with 0 TypeScript errors.
- [ ] Protected endpoints return HTTP 401 when Authorization header is missing.
- [ ] `npm --prefix backend run build` passes cleanly.
- [ ] `context/progress-tracker.md` is updated.
