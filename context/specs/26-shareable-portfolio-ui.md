# Unit 26 Specification — Shareable Portfolio UI

## Goal

Implement the candidate verification portfolio UI (`frontend/src/components/portfolio/`), providing a verifiable showcase of candidate credentials, domain progression, cryptographic proof badges (`>= 80%` score), and an interactive recruiter verification modal with live cryptographic HMAC validation.

## Dependencies

- Unit 20 (Scoring & Verification Engine)
- Unit 23 (Verification Artifact Model)
- Unit 24 (Portfolio Persistence & Compilation)
- Unit 25 (Public Profile API)

## Design

1. **Portfolio View (`frontend/src/components/portfolio/PortfolioView.tsx`)**:
   - Header with candidate display name, headline, member since, external links (GitHub, LinkedIn), and shareable profile link copy action.
   - Verified stats summary banner: total verified skills, average verification score, cross-domain completion progress.
   - Verification proofs grid: list of verified competencies with difficulty level, verified score (`>= 80%`), date of verification, proof ID badge, and "Inspect Proof" action.
   - Domain progression cards: breakdown across Backend, Frontend, and AI & Data Engineer tracks.
   - Recruiter verification mode toggle / public lookup bar to search and verify any candidate `@username` or proof ID `PRF-XXXX-XXXXX`.

2. **Verification Proof Card (`frontend/src/components/portfolio/VerificationProofCard.tsx`)**:
   - Individual proof card with gold/emerald badge, verified score pip, timestamp, issuer stamp (`Hiresense_AI Verification Authority`), and quick verify button.

3. **Public Verification Modal (`frontend/src/components/portfolio/PublicVerificationModal.tsx`)**:
   - Interactive dialog displaying live SHA-256 HMAC cryptographic signature validation, certificate metadata, candidate info, and tamper status.

4. **Integration with App navigation**:
   - Mount `<PortfolioView />` in `App.tsx` under the "Verification / Portfolio" view.

## Invariants Protected

- Only competencies with authoritative backend assessment score `>= 80%` and valid cryptographic proof records are displayed with the "VERIFIED" badge.
- Live tamper verification verifies cryptographic hash against server records.

## Verification Checklist

- [ ] `PortfolioView` renders candidate info, verified stats, proof cards, and domain breakdown.
- [ ] `VerificationProofCard` displays badge and proof ID.
- [ ] `PublicVerificationModal` verifies HMAC integrity and displays proof metadata.
- [ ] Integrated in `App.tsx`.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
