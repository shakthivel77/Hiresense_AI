# Unit 24 Specification — Portfolio Persistence & Compilation

## Goal

Implement the Candidate Portfolio persistence and compilation engine in `backend/src/portfolio/portfolioService.ts`, assembling complete verified profiles (candidate biographical info, all verified skill proofs, domain completion summaries, and verification stats) for internal retrieval and external public presentation.

## Dependencies

- Unit 06 (Profile API)
- Unit 20 (Scoring and Verification Engine)
- Unit 23 (Verification Artifact Model)

## Design

1. **Portfolio Models (`backend/src/portfolio/types.ts`)**:
   - `CandidatePortfolioDTO`:
     - `userId`: string
     - `username`: string
     - `name`: string
     - `headline`?: string
     - `bio`?: string
     - `githubUrl`?: string
     - `linkedinUrl`?: string
     - `avatarUrl`?: string
     - `memberSince`: string
     - `stats`:
       - `totalVerifiedSkills`: number
       - `averageScore`: number
       - `domainsCount`: number
       - `verificationRate`: number
     - `proofs`: `VerificationProofDTO[]`
     - `domainBreakdown`: `DomainProgressDTO[]`
     - `verifiedProfileHash`: string (SHA-256 integrity signature of the full portfolio)
     - `lastUpdated`: string

2. **Portfolio Service (`backend/src/portfolio/portfolioService.ts`)**:
   - `compilePortfolio(userId: string)`:
     - Fetches user profile metadata via `userService`.
     - Fetches verified skill profile via `skillService.getVerifiedSkillProfile`.
     - Fetches all cryptographic proof artifacts via `proofService.getUserProofs`.
     - Calculates portfolio averages and signs portfolio with a global integrity hash.
   - `getPortfolioByUserId(userId: string)`: Retrieves compiled portfolio.
   - `getPortfolioByUsername(username: string)`: Resolves user by username and compiles portfolio.

## Invariants Protected

- Only skills with authoritative verified score `>= 80%` and valid cryptographic proof records are included in the portfolio's verified proofs.
- Portfolio compilation is deterministic and tamper-evident.

## Verification Checklist

- [ ] `CandidatePortfolioDTO` defined in `types.ts`.
- [ ] `PortfolioService.compilePortfolio` combines profile data, verified skills, and proof artifacts.
- [ ] `PortfolioService.getPortfolioByUsername` resolves public candidate profiles.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
