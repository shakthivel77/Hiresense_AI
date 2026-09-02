# Unit 28 Specification — Job Posting Schema & Extractor Model

## Goal

Define the Job Posting and Skill Requirement data models (`backend/src/career/types.ts`) and create the `JobExtractorService` (`backend/src/career/jobExtractorService.ts`) and `JobPostingService` (`backend/src/career/jobPostingService.ts`) for ingesting raw job descriptions, normalizing skill requirements, classifying required vs preferred competencies, and mapping them to canonical roadmap skill identifiers.

## Dependencies

- Unit 08 (Roadmap Internal Schema)
- Unit 11 (Roadmap Read API)

## Design

1. **Job Posting Schema (`backend/src/career/types.ts`)**:
   - `SkillRequirementImportance`: `'REQUIRED' | 'PREFERRED'`.
   - `ExperienceLevel`: `'entry' | 'mid' | 'senior' | 'lead'`.
   - `JobSkillRequirementDTO`:
     - `id`: Unique requirement ID.
     - `skillId`: Canonical roadmap skill slug (e.g., `'restful-apis'`, `'relational-databases'`).
     - `skillName`: Display name.
     - `category`: Competency category (`fundamentals`, `core`, `advanced`, `tools`).
     - `importance`: `'REQUIRED' | 'PREFERRED'`.
     - `weight`: Deterministic weight multiplier (`REQUIRED` = 1.0, `PREFERRED` = 0.5).
   - `JobPostingDTO`:
     - `id`, `title`, `company`, `location`, `employmentType`, `experienceLevel`, `domainSlug`.
     - `rawDescription`: Original text.
     - `requiredSkills`: `JobSkillRequirementDTO[]`.
     - `preferredSkills`: `JobSkillRequirementDTO[]`.
     - `createdAt`, `updatedAt`.

2. **Job Extractor Service (`backend/src/career/jobExtractorService.ts`)**:
   - `extractSkillsFromText(rawText: string, domainSlug?: string)`:
     - Parses sections and bullet points.
     - Detects "Required / Qualifications" vs "Preferred / Nice-to-have" linguistic boundaries.
     - Normalizes extracted skill tokens against roadmap competency dictionary.
     - Assigns canonical `skillId` and importance tier.

3. **Job Posting Service (`backend/src/career/jobPostingService.ts`)**:
   - Manages job repository in memory and Supabase.
   - Pre-seeds realistic benchmark job postings across standard tracks (Backend, Frontend, AI Engineer).
   - `createJobPosting(input)`: Parses description and persists structured job posting.
   - `getJobPostingById(id)`: Retrieves posting with classified requirements.
   - `getAllJobPostings()`: Lists all available postings.

## Invariants Protected

- Deterministic classification: requirement weights (`REQUIRED: 1.0`, `PREFERRED: 0.5`) are fixed and transparent.
- Skill names map to canonical roadmap identifiers without hallucinating untracked phantom skills.

## Verification Checklist

- [ ] `JobPostingDTO` and `JobSkillRequirementDTO` defined in `types.ts`.
- [ ] `JobExtractorService.extractSkillsFromText` correctly splits required vs preferred skills.
- [ ] `JobPostingService` seeds benchmark jobs and persists new postings.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
