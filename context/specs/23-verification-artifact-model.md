# Unit 23 Specification — Verification Artifact Model

## Goal

Define the cryptographic Verification Artifact domain schema (`backend/src/portfolio/types.ts`) and create the `ProofService` (`backend/src/portfolio/proofService.ts`) for generating immutable, cryptographically verifiable proof records (SHA-256 HMAC signatures, human-readable proof IDs, and proof cards) for all verified competencies.

## Dependencies

- Unit 20 (Scoring and Verification Engine)
- Unit 22 (Unlock Progression Engine)

## Design

1. **Types (`backend/src/portfolio/types.ts`)**:
   - `VerificationProofDTO`:
     - `id`: Internal UUID.
     - `proofId`: Human-shareable proof identifier (e.g., `PRF-SKL-7F89A1`).
     - `userId`: Candidate identifier.
     - `candidateName`: Candidate display name.
     - `skillId`, `skillName`, `category`, `difficulty`: Skill metadata.
     - `score`: Assessment score achieved (`>= 80.0`).
     - `passingScore`: 80.0.
     - `attemptId`: Associated assessment attempt ID.
     - `verificationDate`: ISO timestamp of completion.
     - `verificationHash`: SHA-256 cryptographic HMAC certifying authenticity and tamper-resistance.
     - `issuer`: `'Hiresense_AI Verification Authority'`.
     - `status`: `'VALID' | 'REVOKED'`.
     - `proofUrl`: Verification URL (`/verify/:proofId`).
   - `PublicProofCardDTO`: Client-safe shareable card model.

2. **Proof Service (`backend/src/portfolio/proofService.ts`)**:
   - `generateProofHash(data)`: Computes authoritative SHA-256 HMAC signature.
   - `createProofArtifact(params)`: Generates and records an immutable proof artifact upon skill verification.
   - `verifyProofIntegrity(proof)`: Cryptographically verifies the artifact signature against its metadata.
   - `getProofByProofId(proofId)`: Looks up proof by shareable ID.
   - `getUserProofs(userId)`: Returns all proofs earned by a candidate.

## Invariants Protected

- Verification proofs are generated strictly for assessment scores `>= 80%`.
- Verification hashes are tamper-evident: modifying score, skill, or user invalidates the cryptographic signature.
- Proof records are immutable.

## Verification Checklist

- [ ] `VerificationProofDTO` schema defined.
- [ ] `ProofService.createProofArtifact` generates valid cryptographic SHA-256 signatures.
- [ ] `ProofService.verifyProofIntegrity` detects tamper attempts.
- [ ] `npm --prefix backend run build` and `npm --prefix frontend run build` pass with 0 errors.
- [ ] `context/progress-tracker.md` is updated.
