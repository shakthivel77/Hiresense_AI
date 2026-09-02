# Hiresense_AI — Build Plan

This build plan follows the project's spec-driven workflow. Each unit should produce one independently verifiable result and should be implemented only after its dependencies exist.

## Dependency Order

### Phase 0 — Foundation

| Unit | Name | Result | Dependencies |
|---|---|---|---|
| 01 | Repository and App Skeleton | Frontend/backend projects run | None |
| 02 | Environment and Supabase Connection | Backend can connect to Supabase | 01 |
| 03 | Database Baseline | Initial schema/migration exists | 02 |
| 04 | Authentication API | Backend recognizes authenticated users | 02, 03 |
| 05 | Authentication UI | User can register/sign in/sign out | 04 |
| 06 | Profile API | User profile can be created/read/updated | 04, 03 |
| 07 | Profile UI | User can maintain profile | 06 |

### Phase 1 — Roadmap

| Unit | Name | Result | Dependencies |
|---|---|---|---|
| 08 | Roadmap Internal Schema | Domain/roadmap/skill/dependency model exists | 03 |
| 09 | Roadmap Adapter | External roadmap data converts to internal DTOs | 08 |
| 10 | Roadmap Import | Selected roadmap data is persisted | 09 |
| 11 | Roadmap Read API | Frontend can retrieve roadmap graph | 10 |
| 12 | Roadmap UI Shell | Learner can browse roadmap | 11 |
| 13 | Skill State Engine | Lock/available/verified logic works | 10, 06 |
| 14 | Skill Detail UI | Skill details/resources entry point works | 12, 13 |

### Phase 2 — Assessment

| Unit | Name | Result | Dependencies |
|---|---|---|---|
| 15 | Question Schema | Question bank model exists | 03 |
| 16 | Test/Attempt Schema | Attempts and answers persist | 15 |
| 17 | Question Selection Service | Random eligible questions are selected | 15, 16 |
| 18 | Assessment API | Test lifecycle works server-side | 16, 17 |
| 19 | Assessment UI | Learner can take a timed test | 18 |
| 20 | Scoring and Verification | 80% threshold updates user skill | 18, 13 |
| 21 | Attempt Limit | Three-attempt monthly rule is enforced | 20 |
| 22 | Unlock Progression | Verified prerequisites unlock skills | 20, 13 |

### Phase 3 — AI Content

| Unit | Name | Result | Dependencies |
|---|---|---|---|
| 23 | AI Provider Adapter | Replaceable AI interface works | 01 |
| 24 | Question Generation | Validated question pools can be generated | 23, 15 |
| 25 | Question Pool Persistence | Generated pools can be reused | 24, 16 |
| 26 | Resource Model | Resource metadata can be stored/read | 08 |
| 27 | Resource Display | Skill page shows resources | 26, 14 |
| 28 | Project Recommendation | Skill set produces project recommendation | 23, 13 |

### Phase 4 — Competency Profile

| Unit | Name | Result | Dependencies |
|---|---|---|---|
| 29 | Verified Skill API | User's verified skills can be queried | 20 |
| 30 | Skill Dashboard | User sees verified skills and scores | 29 |
| 31 | Cross-Domain Reuse | Existing verified skills remain verified | 29, 13 |

### Phase 5 — Career Intelligence

| Unit | Name | Result | Dependencies |
|---|---|---|---|
| 32 | Job Analysis Schema | Job analysis and requirements persist | 03 |
| 33 | Requirement Extraction | Job description produces normalized skills | 23, 32 |
| 34 | Skill Matching | Required vs verified skills are compared | 29, 33 |
| 35 | Compatibility Score | Deterministic job skill score is produced | 34 |
| 36 | Skill Gap UI | User sees matches, gaps, and recommendations | 35 |

### Phase 6 — Interview

| Unit | Name | Result | Dependencies |
|---|---|---|---|
| 37 | Interview Schema | Sessions/questions/answers/evaluations persist | 03 |
| 38 | Interview Question Generation | Job + skills produce questions | 23, 37 |
| 39 | Interview UI | User can run a text interview | 38 |
| 40 | Answer Evaluation | Answers receive structured AI evaluation | 23, 37, 39 |
| 41 | Interview Report | Session produces final report | 40 |

### Phase 7 — Ranking

| Unit | Name | Result | Dependencies |
|---|---|---|---|
| 42 | Score Components | Skill/domain/project/interview components normalize | 20, 28, 41 |
| 43 | Hiresense Score | Deterministic total score is calculated | 42 |
| 44 | Leaderboard API | Ranked users can be queried | 43 |
| 45 | Leaderboard UI | User can view ranking | 44 |

### Phase 8 — Optional Features

| Unit | Name | Result | Dependencies |
|---|---|---|---|
| 46 | Resume Text Extraction | Resume can be converted to text | 06 |
| 47 | Resume Skill Extraction | Resume skills become unverified claims | 23, 46, 29 |
| 48 | Domain Diagnostic | Missing domain skills can be assessed | 20, 31 |
| 49 | Assessment Integrity Signals | Visibility/focus/fullscreen violations are recorded | 19 |
| 50 | GitHub Analysis | Basic public profile activity is summarized | 06 |
| 51 | Institute/Domain/Skill Leaderboards | Additional ranking scopes | 45 |

### Phase 9 — Integration and Freeze

| Unit | Name | Result | Dependencies |
|---|---|---|---|
| 52 | End-to-End Integration | Complete learner flow works | 05–45 |
| 53 | Security and Validation Pass | Major authorization/input risks addressed | 52 |
| 54 | Reliability and Error-State Pass | Failure paths are handled | 52 |
| 55 | Final UI Polish | Core demo is visually consistent | 52 |
| 56 | Documentation and Demo | Report, diagrams, screenshots, and demo are ready | 53–55 |

## 55-Day Execution Guidance

Do not interpret unit count as one unit per calendar day. Some units are intentionally small and can be grouped into a focused session when they have the same boundary and no independent decision.

Priority rule:

```text
Foundation
→ Roadmap
→ Assessment
→ Verification
→ Competency Profile
→ Career Gap
→ Interview
→ Ranking
→ Optional Features
→ Freeze
```

If time becomes constrained, cut optional units rather than weakening the mandatory assessment/verification/career/interview flow.

## Unit Specification Rule

Each implementation unit should have its own spec with:

1. Goal
2. Design
3. Implementation
4. Dependencies
5. Verification checklist

Do not implement a unit from this build plan alone.
