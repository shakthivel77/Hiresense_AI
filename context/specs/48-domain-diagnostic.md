# Unit 48 Specification — Domain Diagnostic

## Goal

Implement the **Domain Diagnostic Assessment Engine** (`backend/src/assessment/diagnosticService.ts` and routes in `backend/src/assessment/routes.ts`), enabling candidates to generate and take targeted multi-skill diagnostic assessments covering their unverified resume claims and career gaps in a specific domain, verifying multiple skills in a single structured session with deterministic $\ge 80\%$ threshold enforcement per skill.

## Dependencies

- Unit 20 (Scoring and Verification Engine)
- Unit 31 (Job Analyzer API / Gap Engine)
- Unit 46 (Resume Text Extraction)
- Unit 47 (Resume Skill Extraction)

## Design

### 1. Data Contracts (`backend/src/assessment/diagnosticTypes.ts`)

```typescript
export interface DomainDiagnosticRequestDTO {
  domainSlug: string;
  userId?: string;
  targetSkillIds?: string[];
}

export interface DiagnosticQuestionItemDTO {
  id: string;
  skillId: string;
  skillName: string;
  questionText: string;
  options: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface PublicDomainDiagnosticDTO {
  diagnosticId: string;
  domainSlug: string;
  domainName: string;
  title: string;
  totalSkillsTested: number;
  timeLimitMinutes: number;
  expiresAt: string;
  questions: DiagnosticQuestionItemDTO[];
}

export interface DiagnosticAnswerSubmission {
  questionId: string;
  selectedOptionIndex: number;
}

export interface SkillDiagnosticBreakdown {
  skillId: string;
  skillName: string;
  category: string;
  difficulty: string;
  questionsTested: number;
  correctAnswers: number;
  score: number; // 0 - 100
  verified: boolean; // score >= 80
  status: 'VERIFIED' | 'UNVERIFIED';
  proofId?: string;
  feedback?: string;
}

export interface DomainDiagnosticEvaluationDTO {
  diagnosticId: string;
  domainSlug: string;
  userId: string;
  overallScore: number;
  completedAt: string;
  totalSkillsTested: number;
  verifiedSkillsCount: number;
  unverifiedSkillsCount: number;
  skillBreakdown: SkillDiagnosticBreakdown[];
  newlyVerifiedProofs: Array<{ skillId: string; skillName: string; proofId: string; score: number }>;
  recommendedRemediations: Array<{ skillId: string; skillName: string; reason: string }>;
}
```

### 2. Diagnostic Assessment Lifecycle & Invariant Protection

1. **Question Compilation**:
   - Gathers target unverified skills for the requested domain (e.g. from resume claims or career gaps).
   - Samples 2–3 questions per skill from `QuestionBankService` across balanced difficulties.
   - Sets a dynamic time limit based on question volume (e.g. 2 minutes per question).

2. **Per-Skill Verification Isolation**:
   - Each skill tested within the diagnostic is scored independently.
   - **Verification Invariant**: A skill transitions to `VERIFIED` and issues a `VerificationProofDTO` **if and only if** its per-skill score is $\ge 80\%$.
   - Skills below $80\%$ remain `UNVERIFIED` and receive tailored remediation guidance.

3. **Active Session Caching**:
   - Stores active diagnostics in memory/cache with expiration timestamps.

### 3. REST API Endpoints (`backend/src/assessment/routes.ts`)

- **`POST /api/assessment/diagnostic/generate`**:
  - Accepts `DomainDiagnosticRequestDTO`.
  - Returns `PublicDomainDiagnosticDTO` with answer keys stripped.
- **`GET /api/assessment/diagnostic/:diagnosticId`**:
  - Retrieves active diagnostic questions.
- **`POST /api/assessment/diagnostic/submit`**:
  - Accepts `{ diagnosticId, userId, answers: DiagnosticAnswerSubmission[] }`.
  - Evaluates each skill independently, creates verification proofs for skills scoring $\ge 80\%$, and returns `DomainDiagnosticEvaluationDTO`.

## Verification Checklist

- [ ] `backend/src/assessment/diagnosticTypes.ts` defines all diagnostic request/response DTOs.
- [ ] `backend/src/assessment/diagnosticService.ts` implements multi-skill test generation and per-skill evaluation.
- [ ] `backend/src/assessment/routes.ts` mounts `/diagnostic/generate`, `/diagnostic/:diagnosticId`, and `/diagnostic/submit`.
- [ ] `frontend/src/lib/diagnosticApi.ts` provides typed client bindings.
- [ ] Dedicated verification test confirms per-skill $\ge 80\%$ threshold enforcement and proof issuance.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` compile cleanly.
- [ ] `context/progress-tracker.md` updated.
