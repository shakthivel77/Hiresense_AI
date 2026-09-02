# Unit 25 Specification — Public Profile API

## Goal

Expose public and authenticated REST endpoints in `backend/src/portfolio/routes.ts` for accessing candidate verification portfolios (`GET /api/portfolio/:username` and `GET /api/portfolio/me`) and verifying individual cryptographic proof artifacts (`GET /api/portfolio/verify/:proofId`).

## Dependencies

- Unit 04 (Authentication)
- Unit 23 (Verification Artifact Model)
- Unit 24 (Portfolio Persistence & Compilation)

## Design

1. **REST Endpoints (`backend/src/portfolio/routes.ts`)**:
   - `GET /api/portfolio/me`:
     - Protected by `requireAuth`.
     - Returns compiled portfolio for the authenticated candidate.
   - `GET /api/portfolio/:username`:
     - **Public endpoint** (no auth required).
     - Resolves candidate by vanity username and returns full public verification portfolio.
   - `GET /api/portfolio/verify/:proofId`:
     - **Public endpoint** (no auth required).
     - Resolves proof record by `proofId` (e.g., `PRF-REACT-8F29A`).
     - Performs real-time cryptographic HMAC verification and returns `PublicProofCardDTO`.
   - `GET /api/portfolio/user/:userId`:
     - Public/authenticated fallback lookup by user ID.

2. **Server Mount (`backend/src/index.ts`)**:
   - Mount `portfolioRouter` at `/api/portfolio`.

3. **Frontend API Client (`frontend/src/lib/portfolioApi.ts`)**:
   - `fetchMyPortfolio(token: string)`
   - `fetchPublicPortfolio(username: string)`
   - `verifyProof(proofId: string)`

## Invariants Protected

- Public endpoints are accessible without credentials to enable recruiter and external verification.
- Public proof verification computes live cryptographic SHA-256 HMAC integrity checks.

## Verification Checklist

- [ ] `GET /api/portfolio/me` returns compiled portfolio for authenticated user.
- [ ] `GET /api/portfolio/:username` returns public portfolio without authentication.
- [ ] `GET /api/portfolio/verify/:proofId` validates and returns cryptographic proof card.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
