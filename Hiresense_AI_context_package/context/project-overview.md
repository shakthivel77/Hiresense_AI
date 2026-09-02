# Hiresense_AI — Project Overview

## Overview

Hiresense_AI is an AI-enabled learning and career-readiness web application for computer-science and software-engineering learners. It helps a learner choose a domain or career goal, follow a prerequisite-aware roadmap, learn from recommended resources, verify skills through assessments, build a verified competency profile, analyze job descriptions for skill gaps, practice text-based AI interviews, and receive a transparent competency score and rankings. The central product concept is **Learn → Assess → Verify → Build Competency Profile → Analyze Career Gap → Practice Interview → Measure Readiness**.

## Goals

1. Provide structured software-engineering learning roadmaps using an automated roadmap-ingestion approach rather than manually authoring large numbers of roadmaps.
2. Represent roadmap skills and prerequisites so that dependent skills remain locked until required skills are verified.
3. Verify claimed skills through assessments; a skill becomes `VERIFIED` only when the learner achieves at least 80%.
4. Provide reusable learning resources and practical project recommendations for verified/current learning skills.
5. Compare a learner's verified skills with a supplied job description and expose missing skills and a recommended learning path.
6. Provide a text-based AI mock interview with structured evaluation and actionable feedback.
7. Calculate a transparent Hiresense competency score and provide global, institute, domain, and skill-oriented rankings where enough data exists.
8. Complete a coherent end-to-end demonstration within the constraints of a 3-person team, approximately 55 days remaining, and zero budget.

## Core User Flow

1. User registers or signs in.
2. User completes a basic profile and optionally provides career goal, GitHub, LinkedIn, or resume information.
3. User selects a computer-science/software-engineering domain.
4. Hiresense loads the normalized roadmap and identifies prerequisite skills.
5. User opens an available skill.
6. Hiresense displays the skill description and relevant learning resources.
7. User studies the skill.
8. User takes the skill assessment.
9. Backend scores the attempt.
10. If the score is at least 80%, the skill becomes `VERIFIED`.
11. Verified prerequisites unlock dependent skills.
12. The verified skill profile is updated with score, attempts, verification date, and difficulty.
13. Hiresense recommends a practical project based on the learner's verified skills.
14. User can enter a job description.
15. Hiresense extracts job requirements and compares them against verified skills.
16. Hiresense reports matched skills, missing skills, and a transparent compatibility score.
17. User can start a text-based AI mock interview using the job description and verified skills.
18. Hiresense evaluates answers and produces an interview report.
19. Hiresense calculates the user's competency score.
20. The user appears on applicable leaderboards.

## Features

### Authentication and Profile

- Register, sign in, sign out.
- Student or working-professional role.
- Name, email, institution, and career goal.
- Optional GitHub and LinkedIn URLs.
- Verified and unverified skill profile.

### Roadmap and Learning

- Domain selection.
- Normalized roadmap ingestion.
- Skill graph / prerequisite relationships.
- Locked, available, in-progress, and verified states.
- Skill detail pages.
- Learning resources per skill.
- Cross-domain reuse of previously verified skills.

### Skill Verification

- Question-bank-based assessments.
- Timed tests.
- Randomized question selection.
- 80% verification threshold.
- Maximum three attempts per skill per month.
- Backend-enforced verification and attempt rules.
- Assessment integrity signals such as tab visibility/focus/fullscreen events where feasible.

### AI-Assisted Features

- Assessment question generation during content preparation.
- Resume skill extraction.
- Job-description requirement extraction.
- Project recommendation.
- Interview question generation.
- Interview answer evaluation and feedback.

### Career Intelligence

- Job-description input.
- Required-skill extraction.
- Verified-skill comparison.
- Skill-gap analysis.
- Learning recommendations.
- Transparent skill compatibility score.

### Ranking

- Hiresense competency score.
- Global leaderboard.
- Institute leaderboard.
- Domain leaderboard.
- Skill leaderboard where sufficient data exists.

### Optional Features

- Resume extraction.
- Cross-domain diagnostic assessment.
- GitHub profile analysis.
- Assessment integrity monitoring.
- Additional ranking views.

## Scope

### In Scope

- React + TypeScript frontend.
- Node.js + Express.js + TypeScript modular monolith backend.
- PostgreSQL through Supabase.
- Supabase Auth.
- Roadmap adapter/parser for an open-source roadmap source such as developer-roadmap/roadmap.sh, subject to applicable licensing/attribution requirements.
- Internal normalized roadmap schema.
- Skill dependency graph.
- Skill verification assessment engine.
- AI-assisted reusable question pools.
- Verified skill profile.
- Resource metadata and links.
- Project recommendation.
- Job-description skill-gap analysis.
- Text-based AI interview.
- Hiresense competency score.
- Basic leaderboards.
- Zero-cost/free-tier deployment where required for demonstration.

### Out of Scope

- Commercial production scaling.
- Kubernetes or container orchestration.
- Microservices.
- Kafka or distributed event infrastructure.
- Custom LLM training.
- Real-time video interviewing.
- Facial emotion detection.
- Voice emotion recognition.
- Webcam proctoring.
- LinkedIn/Indeed/Naukri scraping.
- General job-board scraping.
- Blockchain certificates.
- Large-scale recommendation infrastructure.
- Hosting third-party course/video content.
- Treating resume-extracted skills as verified skills.

## Success Criteria

1. A new user can register, sign in, and maintain a profile.
2. A learner can select a supported domain and open a normalized roadmap.
3. Roadmap prerequisites determine which skills are locked or available.
4. A learner can open a skill and see its learning resources.
5. A learner can take a timed assessment.
6. A score of 80% or higher changes the skill to `VERIFIED`.
7. A failed assessment does not verify the skill.
8. The backend prevents more than three attempts for the same skill within a calendar month.
9. Passing a prerequisite unlocks eligible dependent skills.
10. Verified skills persist across domains.
11. A job description can be analyzed against verified skills.
12. The system identifies missing skills without making unsupported hiring predictions.
13. A learner can complete a text-based AI mock interview.
14. Interview answers receive structured evaluation and feedback.
15. Hiresense score calculation is deterministic and reproducible.
16. A leaderboard can rank users using the defined competency score.
17. The complete learner journey can be demonstrated end to end.
18. The implementation remains within the project's zero-budget and time constraints.
