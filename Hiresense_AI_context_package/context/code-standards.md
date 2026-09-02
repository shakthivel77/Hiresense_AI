# Hiresense_AI — Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes; do not layer workarounds over broken abstractions.
- Do not mix unrelated concerns in one component, service, or route.
- Prefer explicit, readable code over clever abstractions.
- Keep domain logic in backend services/modules rather than UI components.
- Do not duplicate business rules between frontend and backend.
- Name functions and variables according to domain meaning.
- Avoid speculative abstractions that are not required by the current feature.
- Keep changes limited to the current feature unit.

## TypeScript

- Use TypeScript throughout frontend and backend.
- Enable strict TypeScript mode.
- Avoid `any`.
- Use explicit interfaces/types or narrowly scoped generics.
- Validate unknown external input at system boundaries.
- Validate AI responses before trusting them.
- Avoid non-null assertions unless the invariant is explicit and unavoidable.
- Prefer discriminated unions for state machines such as skill status.
- Keep DTOs separate from database models when their responsibilities differ.
- Do not expose database internals directly as public API contracts.

## React

- Keep components focused on presentation and interaction.
- Keep business rules out of presentational components.
- Reuse components for repeated UI patterns.
- Prefer controlled state for forms and assessment interactions where appropriate.
- Keep browser-only APIs such as visibility/focus handling inside dedicated hooks/components.
- Avoid large components that combine data fetching, business logic, and presentation.
- Handle loading, empty, success, and error states explicitly.

## Tailwind and Styling

- Use semantic CSS custom-property tokens for project colors.
- Do not hardcode repeated colors directly in components.
- Follow `ui-context.md` for visual language, typography, spacing, radius, and component conventions.
- Do not introduce arbitrary styling patterns when an existing token/component pattern exists.
- Keep responsive behavior explicit.
- Maintain accessible contrast and keyboard interaction.

## API Routes

- Validate and parse request input before application logic runs.
- Enforce authentication before protected operations.
- Enforce ownership before user-owned mutations.
- Keep route handlers thin; delegate business logic to services.
- Return consistent predictable response shapes.
- Never expose internal stack traces or provider secrets.
- Return meaningful HTTP status codes.
- Do not trust client-provided user IDs for ownership.
- Do not let the client submit authoritative score/verification values.
- Rate-limit or guard expensive AI endpoints where practical.

## AI Integration

- Treat all AI output as untrusted input.
- Require structured JSON for machine-consumed AI operations.
- Validate AI output against a schema before persistence.
- Use reusable prompts and version them when necessary.
- Cache reusable generated question pools.
- Do not regenerate static question banks for every test attempt.
- Never let AI decide authorization, verification thresholds, attempt limits, or ranking formulas.
- Provide deterministic fallbacks for AI failures where practical.

## Database

- Use normalized relational structures for core entities.
- Add foreign keys for important relationships.
- Add indexes for frequent lookup paths.
- Enforce uniqueness where domain rules require it.
- Prefer database constraints for invariants that can safely be enforced there.
- Keep migrations version-controlled.
- Do not store large external documents directly in relational columns.
- Store metadata and URLs for external resources.
- Do not expose database credentials to the frontend.

## Assessment

- The server determines the authoritative test questions.
- The server calculates the authoritative score.
- The server determines pass/fail.
- The server records attempt timestamps.
- The server enforces the monthly attempt limit.
- Randomization must be performed in a way that does not allow the client to choose authoritative answers.
- Do not send answer keys to the browser before submission.

## File Organization

```text
frontend/
  src/
    components/
    features/
    hooks/
    lib/
    pages/
    types/

backend/
  src/
    auth/
    users/
    roadmap/
    skills/
    assessment/
    resources/
    projects/
    career/
    interview/
    ranking/
    ai/
    common/

database/
  migrations/
  seeds/

context/
  project-overview.md
  architecture.md
  code-standards.md
  ai-workflow-rules.md
  ui-context.md
  progress-tracker.md
  specs/
```

## Testing

- Test deterministic business rules first.
- Include tests for the 80% boundary.
- Include tests for the three-attempt monthly limit.
- Include prerequisite/unlock tests.
- Include ownership/authorization tests.
- Include AI schema-validation tests using mocked responses.
- Test important API failure paths.
- Run the project build before closing a feature unit.

## Git

- Use small focused commits.
- Use feature branches where practical.
- Do not mix unrelated changes in one commit.
- Use commit messages that identify the feature/unit.
