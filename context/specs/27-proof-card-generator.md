# Unit 27 Specification — Proof Card Generator

## Goal

Finalize Phase 3 (Verification Portfolio) by creating the **Proof Card Generator**, supporting:
1. A server-side standalone SVG badge generator endpoint (`GET /api/portfolio/badge/:proofId.svg`) for embedding verifiable credentials in GitHub READMEs, LinkedIn, and personal websites.
2. An interactive client-side Proof Card exporter modal (`ProofCardModal.tsx`) allowing candidates to inspect, copy markdown/HTML embeds, and download SVG badge assets.

## Dependencies

- Unit 23 (Verification Artifact Model)
- Unit 25 (Public Profile API)
- Unit 26 (Shareable Portfolio UI)

## Design

1. **Server-side SVG Badge Generator (`backend/src/portfolio/proofService.ts` & `routes.ts`)**:
   - `generateProofBadgeSvg(proofCard: PublicProofCardDTO): string`:
     - Creates a standalone, responsive SVG card (width: 480, height: 260) with dark theme gradients (`#0c0d0e` to `#141618`), verified emerald badges, score indicator (`>= 80%`), candidate name, skill title, proof ID, verification timestamp, and cryptographic verification hash watermark.
   - Endpoint: `GET /api/portfolio/badge/:proofId.svg`:
     - Resolves proof record by `proofId`.
     - Returns SVG markup with `Content-Type: image/svg+xml`.

2. **Frontend Exporter Modal (`frontend/src/components/portfolio/ProofCardModal.tsx`)**:
   - Preview of the standalone proof badge card.
   - One-click copy for Markdown embed snippet (`![Hiresense_AI Verification](...)`).
   - One-click copy for HTML snippet.
   - Direct SVG download trigger (`downloadBadgeSvg`).
   - Integration in `VerificationProofCard` and `PublicVerificationModal`.

## Invariants Protected

- SVG badge is only generated for authentic, verified competencies with score `>= 80%`.
- Badge embeds include the verifiable proof ID and cryptographic integrity signature.

## Verification Checklist

- [ ] `generateProofBadgeSvg` generates valid standalone SVG markup.
- [ ] `GET /api/portfolio/badge/:proofId.svg` returns `image/svg+xml`.
- [ ] `ProofCardModal.tsx` provides markdown/HTML snippet copy and direct SVG download.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated marking Phase 3 as COMPLETE.
