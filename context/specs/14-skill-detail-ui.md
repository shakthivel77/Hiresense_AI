# Unit 14 Specification — Skill Detail UI

## Goal

Implement the dedicated Skill Detail & Learning Resources UI in the frontend (`frontend/src/components/skills/SkillDetailView.tsx` / `frontend/src/components/roadmap/SkillDetailModal.tsx`) and the resource query endpoint (`backend/src/resources/`) to display skill metadata, prerequisite dependency chains, curated learning resources, and assessment launchpad.

## Dependencies

- Unit 12 (Roadmap UI Shell)
- Unit 13 (Skill State Engine)

## Design

1. **Resources API (`backend/src/resources/`)**:
   - `ResourceDTO`: `id`, `skillSlug`, `title`, `url`, `type` (`documentation` | `tutorial` | `video` | `article`), `source`, `description`.
   - `GET /api/resources/:skillSlug`: Public endpoint returning curated learning resources for a skill.
   - Mounted at `/api/resources` in `backend/src/index.ts`.

2. **Skill Detail UI (`frontend/src/components/skills/` or `frontend/src/components/roadmap/`)**:
   - Tabbed or multi-section layout:
     - **Overview**: Description, difficulty, category, verification state, prerequisite graph list (with status & drill-down), and downstream unlocked competencies.
     - **Learning Resources**: Curated learning materials categorized with badges, external links, and type icons.
     - **Verification & Assessment**: Test format explanation (15-min timed test, randomized questions, >= 80% passing score, 3 attempts/month limit), attempt history, and action trigger.
   - Adheres to `ui-context.md` dark-workspace tokens, Lucide icons, and responsive design.

## Verification Checklist

- [ ] `GET /api/resources/:skillSlug` returns curated resources for roadmap skills.
- [ ] Skill detail view displays title, category, difficulty, status, and prerequisites.
- [ ] Learning resources tab displays external links with source and type indicators.
- [ ] Prerequisites can be clicked to drill down into prerequisite skill details.
- [ ] Assessment readiness section clearly displays the 80% passing threshold and 3 attempt/month limit.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
