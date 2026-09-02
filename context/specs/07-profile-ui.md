# Unit 07 Specification — Profile UI

## Goal

Provide a React component (`frontend/src/components/profile/ProfileView.tsx`) enabling learners to manage their profile details (Name, Institution, Career Goal, GitHub URL, LinkedIn URL) and view their account role and verification status.

## Dependencies

- Unit 01 — Repository and App Skeleton
- Unit 05 — Authentication UI
- Unit 06 — Profile API

## Design

1. **Profile Component (`frontend/src/components/profile/ProfileView.tsx`)**:
   - Displays user profile summary card.
   - Form inputs for updating Display Name, Institution, Career Goal, GitHub URL, and LinkedIn URL.
   - Saves updates via `PUT /api/users/profile`.
   - Adheres to dark technical theme tokens (`--bg-surface`, `--accent-primary`, `--border-default`).
2. **App Shell Integration**:
   - Navigation item or modal trigger allowing quick access to user profile settings.

## Verification Checklist

- [ ] Profile form fields populate from current user profile state.
- [ ] Save changes updates state cleanly and notifies user.
- [ ] `npm --prefix frontend run build` passes with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
