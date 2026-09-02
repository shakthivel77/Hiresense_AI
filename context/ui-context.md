# Hiresense_AI — UI Context

## Theme

Use a **dark technical learning workspace** aesthetic.

The UI should feel like a modern developer platform rather than a generic education portal:

- near-black page background,
- layered dark surfaces,
- clear hierarchy,
- restrained borders,
- vivid but controlled accent colors,
- strong status indicators for skill progression,
- compact developer-oriented information density.

Avoid excessive gradients, decorative animations, and visual noise.

## Colors

Use CSS custom properties. Components should consume semantic tokens rather than hardcoded hex values.

| Role | CSS Variable | Proposed Value |
|---|---|---|
| Page background | `--bg-base` | `#0B0F14` |
| Surface | `--bg-surface` | `#111820` |
| Elevated surface | `--bg-elevated` | `#17212B` |
| Primary text | `--text-primary` | `#F3F6FA` |
| Muted text | `--text-muted` | `#94A3B8` |
| Primary accent | `--accent-primary` | `#38BDF8` |
| Secondary accent | `--accent-secondary` | `#A78BFA` |
| Border | `--border-default` | `#263241` |
| Error | `--state-error` | `#F87171` |
| Warning | `--state-warning` | `#FBBF24` |
| Success | `--state-success` | `#34D399` |
| Locked | `--state-locked` | `#64748B` |

If the existing application already contains a token system, preserve it rather than replacing it without reason.

## Typography

| Role | Font | Variable |
|---|---|---|
| UI text | Inter or system sans | `--font-sans` |
| Code/technical text | JetBrains Mono or system mono | `--font-mono` |

Typography should prioritize readability and information hierarchy.

## Border Radius

| Context | Class |
|---|---|
| Inline / small UI | `rounded-md` |
| Cards / panels | `rounded-lg` |
| Modals / overlays | `rounded-xl` |
| Large dashboard containers | `rounded-xl` |

Do not introduce many unrelated radius values.

## Component Library

Use shadcn/ui or an equivalent lightweight accessible component layer where it is already present.

Prefer existing reusable primitives for:

- Button
- Input
- Select
- Dialog
- Dropdown
- Tabs
- Card
- Badge
- Progress
- Tooltip
- Alert
- Table

Do not recreate basic primitives unnecessarily.

## Layout Patterns

### Application Shell

- Persistent sidebar on desktop.
- Compact top navigation on mobile.
- Main content area with readable max-width.
- Consistent page header with title and contextual action.

### Dashboard

Use a grid of focused cards:

- current learning progress,
- verified skills,
- next available skill,
- career readiness,
- interview score,
- ranking.

Do not overload the first screen with every feature.

### Roadmap

Use a graph/step-oriented visualization:

- verified = success indicator,
- available = accent indicator,
- locked = muted indicator,
- in-progress = accent + progress indicator.

Roadmap UI must clearly communicate prerequisites.

### Skill Detail

Show:

- skill title,
- difficulty,
- prerequisite status,
- description,
- learning resources,
- assessment action,
- current verification status.

### Assessment

Use a distraction-minimized layout:

- question progress,
- timer,
- question content,
- answer controls,
- clear submit action,
- integrity-status indicator where implemented.

Do not display answer keys.

### Career Analysis

Use:

- job match score,
- matched skills,
- missing skills,
- recommended learning path,
- evidence/explanation for the score.

### Interview

Use a focused conversational/test layout:

- question,
- answer input,
- progress,
- submit,
- evaluation after answer where configured.

### Ranking

Use:

- rank,
- user display name,
- score,
- domain/institute context,
- verified skill count where useful.

Avoid exposing sensitive profile data.

## Icons

Use Lucide React or the existing icon library.

Prefer stroke-based icons.

Suggested sizes:

- `h-4 w-4` inline,
- `h-5 w-5` buttons,
- `h-6 w-6` feature indicators.

## Accessibility

- Maintain keyboard accessibility.
- Use visible focus states.
- Provide labels for form controls.
- Do not rely on color alone for skill status.
- Use semantic headings.
- Ensure sufficient contrast.
- Provide meaningful empty and error states.

## Motion

Use motion sparingly.

Acceptable:

- subtle page transitions,
- progress transitions,
- small state changes.

Avoid:

- continuous decorative animation,
- distracting roadmap movement,
- animations that interfere with timed assessments.
