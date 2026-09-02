# Unit 05 Specification — Authentication UI

## Goal

Provide client-side authentication management, state context, and UI dialogs for registration, sign-in, and sign-out in the React frontend.

## Dependencies

- Unit 01 — Repository and App Skeleton
- Unit 02 — Environment and Supabase Connection
- Unit 04 — Authentication API

## Design

1. **Auth Context (`frontend/src/context/AuthContext.tsx`)**:
   - Manages current user state, auth token, loading state.
   - Provides `login(email, password)`, `register(email, password, displayName, role)`, and `logout()`.
   - Includes local mock dev mode fallback for local demonstration when live Supabase keys are not populated.
2. **Auth Components**:
   - `LoginForm.tsx`: Email + password input with error handling and loading feedback.
   - `RegisterForm.tsx`: Registration form accepting full name, email, password, institution, and role (`student` / `professional`).
   - `AuthModal.tsx`: Accessible dialog containing tabs for Login and Register.
3. **App Header Integration**:
   - Header displays current user display name / email and Logout button when authenticated.
   - Displays "Sign In" button when unauthenticated.

## Verification Checklist

- [ ] AuthContext provides state without React re-render loops.
- [ ] Login and Register forms adhere to dark technical theme tokens (`--bg-surface`, `--accent-primary`).
- [ ] `npm --prefix frontend run build` passes with zero errors.
- [ ] `context/progress-tracker.md` is updated.
