# Unit 46 Specification — Resume Text Extraction

## Goal

Implement the **Resume Text Extraction and Segmentation Engine** (`backend/src/resume/`), allowing candidates to upload or paste their resumes (PDF Base64 or plain text) and extracting clean, standardized, sanitized plain text partitioned into structural sections (`contact`, `summary`, `experience`, `education`, `skills`, `projects`, `certifications`) ready for downstream unverified skill extraction (Unit 47).

## Dependencies

- Unit 06 (Profile API)

## Design

### 1. Data Contracts (`backend/src/resume/types.ts`)

```typescript
export interface ResumeExtractionRequest {
  rawText?: string;
  fileBase64?: string;
  mimeType?: 'application/pdf' | 'text/plain' | 'text/markdown';
  fileName?: string;
}

export interface ExtractedContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface ExtractedExperienceItem {
  company: string;
  role: string;
  duration?: string;
  bullets: string[];
}

export interface ExtractedEducationItem {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  year?: string;
}

export interface ExtractedProjectItem {
  title: string;
  technologies: string[];
  description: string;
}

export interface ResumeSectionBreakdown {
  contact: ExtractedContactInfo;
  summary?: string;
  experience: ExtractedExperienceItem[];
  education: ExtractedEducationItem[];
  rawSkillsText: string[];
  projects: ExtractedProjectItem[];
  certifications: string[];
}

export interface ResumeExtractionResultDTO {
  success: boolean;
  rawTextLength: number;
  normalizedText: string;
  sections: ResumeSectionBreakdown;
  extractedAt: string;
  warningNotice?: string;
}
```

### 2. Extraction & Segmentation Pipeline (`backend/src/resume/resumeExtractor.ts`)

1. **Text Decoding & Sanitization**:
   - Accepts plain text, markdown, or Base64-encoded PDF/text streams.
   - Decodes ASCII/UTF-8 streams, normalizes carriage returns, cleans null bytes and non-printable control characters.
   - Converts fancy Unicode bullets (`•`, `▪`, `►`, `–`, `—`) to clean markdown standard dashes.

2. **Deterministic Section Boundary Detection**:
   - Uses regex patterns to identify common section headers (e.g. `EXPERIENCE`, `WORK HISTORY`, `EDUCATION`, `SKILLS & TECHNOLOGIES`, `PROJECTS`, `CERTIFICATIONS`, `SUMMARY / OBJECTIVE`).
   - Slices document into segmented blocks.

3. **Contact & URL Extraction**:
   - Standard regex parsers for emails, phone numbers, GitHub profile URLs, LinkedIn URLs, and portfolio links.

4. **Section Parsing**:
   - `experience`: Extracts role title, company name, time duration, and bullet points.
   - `education`: Extracts university/college, degree, and graduation year.
   - `projects`: Extracts project title, mentioned technologies, and description.
   - `skills`: Extracts listed skill tokens and keywords.

### 3. REST API Endpoints (`backend/src/resume/routes.ts`)

- **`POST /api/resume/extract-text`**:
  - Accepts `ResumeExtractionRequest` payload.
  - Returns `ResumeExtractionResultDTO` containing sanitized full text and segmented sections.
- **`POST /api/resume/parse-raw`**:
  - Direct text parsing endpoint for pasted candidate resumes.

### 4. Server Registration (`backend/src/index.ts`)

- Mount `app.use('/api/resume', resumeRouter);`.

### 5. Invariants Protected

- Resume content extraction produces **zero verified skills** by default; all extracted skills and claims remain strictly unverified.
- Parsed text is stripped of any malicious binary payloads, shell escape characters, or script tags.

## Verification Checklist

- [ ] `backend/src/resume/types.ts` defines all extraction contracts.
- [ ] `backend/src/resume/resumeExtractor.ts` implements sanitization, PDF/text decoding, and section segmentation.
- [ ] `backend/src/resume/routes.ts` provides `/extract-text` and `/parse-raw`.
- [ ] `backend/src/index.ts` mounts `/api/resume`.
- [ ] `frontend/src/lib/resumeApi.ts` provides typed client fetch methods.
- [ ] Zero-error verification test and clean build.
- [ ] `context/progress-tracker.md` updated.
