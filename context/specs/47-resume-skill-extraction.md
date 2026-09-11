# Unit 47 Specification — Resume Skill Extraction

## Goal

Implement the **Resume Skill Extraction & Taxonomy Mapping Engine** (`backend/src/resume/skillExtractor.ts` and `backend/src/resume/routes.ts`), matching candidate resume text against the canonical Hiresense skill taxonomy, mapping detected skills to candidate profiles as **`UNVERIFIED` claims**, and enabling immediate targeted diagnostic assessments (Unit 48).

## Dependencies

- Unit 23 (Verification Artifact Model)
- Unit 29 (Deterministic Match Engine / Verified Skill API)
- Unit 46 (Resume Text Extraction)

## Design

### 1. Data Contracts (`backend/src/resume/types.ts`)

```typescript
export interface ExtractedSkillClaimDTO {
  skillId: string;
  skillName: string;
  category: string;
  domainSlug: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'UNVERIFIED';
  verificationScore: null;
  matchType: 'exact' | 'alias' | 'contextual';
  extractedFrom: 'skills_section' | 'experience' | 'projects' | 'education';
  mentionContext?: string;
  confidence: number; // 0.0 - 1.0
}

export interface ResumeSkillExtractionResponseDTO {
  success: boolean;
  totalClaimsFound: number;
  matchedTaxonomySkills: ExtractedSkillClaimDTO[];
  unmappedKeywords: string[];
  candidateProfileUpdate: {
    userId?: string;
    totalUnverifiedClaims: number;
    recommendedAssessmentSkillIds: string[];
  };
  invariantNotice: string;
  extractedAt: string;
}

export interface ImportSkillClaimsRequestDTO {
  userId: string;
  claims: ExtractedSkillClaimDTO[];
}
```

### 2. Skill Taxonomy & Alias Match Engine (`backend/src/resume/skillExtractor.ts`)

1. **Taxonomy Dictionary**:
   - Comprehensive dictionary of roadmap skills across `backend-developer`, `frontend-developer`, `ai-data-engineer` tracks.
   - Comprehensive alias mapping table:
     - `Node.js` $\leftarrow$ `['node', 'nodejs', 'node.js', 'express', 'expressjs', 'nest', 'nestjs']`
     - `PostgreSQL` $\leftarrow$ `['postgres', 'postgresql', 'psql', 'pg', 'sql']`
     - `TypeScript` $\leftarrow$ `['typescript', 'ts']`
     - `React State Management` $\leftarrow$ `['react', 'reactjs', 'redux', 'zustand', 'react context']`
     - `PyTorch Deep Learning` $\leftarrow$ `['pytorch', 'torch', 'deep learning', 'neural networks', 'cnn', 'rnn', 'transformers']`
     - `Docker Containerization` $\leftarrow$ `['docker', 'containers', 'dockerfile', 'compose', 'k8s', 'kubernetes']`
     - `REST API Security` $\leftarrow$ `['rest security', 'jwt', 'oauth', 'api security', 'auth', 'csrf', 'cors']`
     - `Redis Caching` $\leftarrow$ `['redis', 'caching', 'memcached', 'cache']`
     - `Web Performance` $\leftarrow$ `['web performance', 'lighthouse', 'core web vitals', 'lazy loading', 'code splitting']`
     - `Vector Embeddings` $\leftarrow$ `['embeddings', 'vector search', 'pinecone', 'chroma', 'rag', 'llm']`

2. **Multi-Section Contextual Scanner**:
   - Primary pass: Scans explicit `rawSkillsText` tokens from resume.
   - Secondary pass: Scans `experience` bullet points and `projects` descriptions for contextual application.
   - Dedupes matches and ranks by confidence.

3. **Strict Invariant Stamping**:
   - Explicitly stamps `status: 'UNVERIFIED'`, `verificationScore: null`.
   - Generates recommended skills for immediate diagnostic evaluation (Unit 48).

### 3. REST API Endpoints (`backend/src/resume/routes.ts`)

- **`POST /api/resume/extract-skills`**:
  - Accepts raw text or parsed resume sections.
  - Returns `ResumeSkillExtractionResponseDTO`.
- **`POST /api/resume/import-claims`**:
  - Persists extracted unverified claims into candidate's skill state.

### 4. Invariants Protected

- All extracted skills are stamped strictly with `status: 'UNVERIFIED'` and `verificationScore: null`.
- Self-claims from resumes cannot grant verified portfolio proofs or affect leaderboard ranking without a proctored assessment score $\ge 80\%$.

## Verification Checklist

- [ ] `backend/src/resume/types.ts` extended with `ExtractedSkillClaimDTO` and extraction response models.
- [ ] `backend/src/resume/skillExtractor.ts` implements dictionary and alias match engine.
- [ ] `backend/src/resume/routes.ts` provides `/extract-skills` and `/import-claims`.
- [ ] `frontend/src/lib/resumeApi.ts` extended with skill extraction client methods.
- [ ] Unit test verification proves:
  - Exact and alias matching for skills.
  - Identification of unmapped keywords.
  - Strictest adherence to the `UNVERIFIED` invariant.
- [ ] `context/progress-tracker.md` updated.
