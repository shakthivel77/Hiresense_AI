# Unit 31 Specification — Job Analyzer API

## Goal

Create REST API endpoints in `backend/src/career/routes.ts` mounted at `/api/career` to expose job posting retrieval, custom job ingestion, on-the-fly text requirement parsing, deterministic match calculations, and career gap recommendations.

## Dependencies

- Unit 28 (Job Posting Schema & Extractor Model)
- Unit 29 (Deterministic Match Engine)
- Unit 30 (Gap Analysis Engine)

## Design

1. **REST Endpoints (`backend/src/career/routes.ts`)**:
   - `GET /api/career/jobs`: List all benchmark and created job postings.
   - `GET /api/career/jobs/:jobId`: Retrieve details and extracted requirements for a job posting.
   - `POST /api/career/jobs`: Ingest and persist a new job posting (`CreateJobPostingInput`).
   - `POST /api/career/parse`: Parse raw text on the fly and return extracted required vs preferred skills.
   - `POST /api/career/match/:jobId`: Run deterministic match and gap analysis for user against a stored job.
   - `POST /api/career/match-text`: Run match and gap analysis for user against raw pasted text.

2. **Server Mount (`backend/src/index.ts`)**:
   - Mount `careerRouter` at `/api/career`.

3. **Frontend API Client (`frontend/src/lib/careerApi.ts`)**:
   - `fetchJobPostings`
   - `fetchJobPostingById`
   - `createJobPosting`
   - `parseJobText`
   - `analyzeJobMatch`
   - `analyzeJobMatchText`

## Invariants Protected

- All match scores and gap recommendations are computed through `jobMatchEngine` and `jobGapEngine` deterministically.
- AI never calculates match percentages.

## Verification Checklist

- [ ] `GET /api/career/jobs` lists benchmark job postings.
- [ ] `POST /api/career/parse` parses text into required/preferred skills.
- [ ] `POST /api/career/match/:jobId` and `POST /api/career/match-text` return `CareerGapAnalysisDTO`.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
