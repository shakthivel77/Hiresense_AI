# Unit 02 Specification — Environment and Supabase Connection

## Goal

Establish environment variable management (`.env` and `.env.example`) and configure the server-side Supabase client initialization in `backend/src/common/` so the backend can securely interact with PostgreSQL / Supabase Auth services.

## Dependencies

- Unit 01 — Repository and App Skeleton (Completed)

## Design

1. **Environment Variables**:
   - `backend/.env.example` & `backend/.env`:
     - `PORT=5000`
     - `NODE_ENV=development`
     - `SUPABASE_URL=https://your-supabase-project.supabase.co`
     - `SUPABASE_ANON_KEY=your-supabase-anon-key`
     - `SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key` (Backend only, never exposed to client)
   - `frontend/.env.example` & `frontend/.env`:
     - `VITE_SUPABASE_URL=https://your-supabase-project.supabase.co`
     - `VITE_SUPABASE_ANON_KEY=your-supabase-anon-key`

2. **Supabase Client Abstraction**:
   - Install `@supabase/supabase-js` in `backend/`.
   - Implement `backend/src/common/supabase.ts` providing initialized Supabase client instances:
     - `supabase`: Public / Anon client using `SUPABASE_ANON_KEY`.
     - `supabaseAdmin`: Admin client using `SUPABASE_SERVICE_ROLE_KEY` for server-side trusted operations.
   - Implement environment validation to ensure startup fails early with a clear message if required environment variables are missing when running in production.

3. **Backend Health Check Integration**:
   - Enhance `/api/health` or add `/api/health/supabase` to verify Supabase client initialization status without leaking credentials.

## Implementation Steps

1. Install `@supabase/supabase-js` in `backend/`.
2. Create `.env.example` and `.env` in both `backend/` and `frontend/`. Add `.env` to `.gitignore`.
3. Implement `backend/src/common/supabase.ts` with Supabase client export and helper validation.
4. Update `backend/src/index.ts` to include health verification for Supabase initialization.
5. Verify TypeScript compilation and build.
6. Update `context/progress-tracker.md`.

## Explicit Scope Exclusions

Do NOT implement:
- Database table migrations or schemas (Unit 03)
- Authentication API endpoints or login UI (Unit 04 & 05)
- User profile schemas or APIs (Unit 06 & 07)

## Verification Checklist

- [ ] `.env.example` exists in both `backend/` and `frontend/`.
- [ ] `.env` is listed in `.gitignore` in both projects.
- [ ] `backend/src/common/supabase.ts` compiles cleanly with TypeScript strict mode.
- [ ] `npm --prefix backend run build` passes with zero errors.
- [ ] `npm --prefix frontend run build` passes with zero errors.
- [ ] `/api/health` indicates Supabase configuration status.
- [ ] `context/progress-tracker.md` is updated.
