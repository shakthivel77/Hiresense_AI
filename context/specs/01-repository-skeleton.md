# Unit 01 Specification — Repository and App Skeleton

## Goal

Establish the initial Hiresense_AI application stack layout so that both `frontend/` and `backend/` run cleanly in local development with strict TypeScript settings, modular architecture boundaries, and dark developer UI tokens.

## Dependencies

- None. (Phase 0, Unit 01)

## Design

1. **Backend**: Express + Node.js + TypeScript application setup in `backend/`.
   - Entry point: `backend/src/index.ts`
   - Express server listening on port 5000 with `/api/health` endpoint.
   - Modular monolith folder structure:
     `backend/src/auth/`, `users/`, `roadmap/`, `skills/`, `assessment/`, `resources/`, `projects/`, `career/`, `interview/`, `ranking/`, `ai/`, `common/`
2. **Frontend**: Vite + React + TypeScript application setup in `frontend/`.
   - Dev server on port 3000 (proxying `/api` to `http://localhost:5000`).
   - Tailwind CSS tokens matching `context/ui-context.md`:
     - `--bg-base`: `#0B0F14`
     - `--bg-surface`: `#111820`
     - `--bg-elevated`: `#17212B`
     - `--text-primary`: `#F3F6FA`
     - `--text-muted`: `#94A3B8`
     - `--accent-primary`: `#38BDF8`
     - `--accent-secondary`: `#A78BFA`
     - `--border-default`: `#263241`
     - `--state-error`: `#F87171`
     - `--state-warning`: `#FBBF24`
     - `--state-success`: `#34D399`
     - `--state-locked`: `#64748B`
3. **Database Structure**:
   - `database/migrations/`
   - `database/seeds/`
   - `database/README.md`

## Implementation Steps

1. Create `backend/package.json`, `backend/tsconfig.json`, and initial entry code with module placeholders.
2. Create `frontend/package.json`, `frontend/tsconfig.json`, Vite configuration, Tailwind CSS configuration, and basic App layout shell.
3. Create `database/` placeholders.
4. Verify build and dev execution for both apps.
5. Update `context/progress-tracker.md`.

## Explicit Scope Exclusions

Do NOT implement:
- Supabase client or DB migrations (reserved for Unit 02 & 03)
- Authentication API or UI (reserved for Unit 04 & 05)
- User profile API/UI (reserved for Unit 06 & 07)
- Roadmap, Assessment, AI, or Career logic

## Verification Checklist

- [ ] `npm --prefix backend run build` compiles with 0 TypeScript errors.
- [ ] `npm --prefix frontend run build` compiles cleanly with 0 TypeScript/Vite errors.
- [ ] Backend `/api/health` returns HTTP 200 `{ status: "ok", name: "Hiresense_AI API" }`.
- [ ] Frontend displays dark technical theme layout without console errors.
- [ ] `context/progress-tracker.md` is updated.
