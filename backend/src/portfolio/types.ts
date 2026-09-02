import { DomainProgressDTO } from '../skills/types.js';

export type VerificationStatus = 'VALID' | 'REVOKED';

/**
 * Verifiable Credential / Proof Record for a verified skill competency
 */
export interface VerificationProofDTO {
  id: string;
  proofId: string; // Compact human-shareable ID, e.g. PRF-JS-8F29A
  userId: string;
  candidateName: string;
  candidateEmail?: string;
  skillId: string;
  skillName: string;
  category: string;
  difficulty: string;
  score: number;
  passingScore: number;
  attemptId: string;
  verificationDate: string;
  verificationHash: string; // SHA-256 HMAC signature
  issuer: string;
  status: VerificationStatus;
  proofUrl: string;
}

/**
 * Public Verifiable Proof Card for candidate profiles and public verification pages
 */
export interface PublicProofCardDTO {
  proofId: string;
  candidateName: string;
  skillName: string;
  category: string;
  difficulty: string;
  score: number;
  verificationDate: string;
  verificationHash: string;
  issuer: string;
  status: VerificationStatus;
  verified: boolean;
}

/**
 * Parameters to create a new Verification Proof Artifact
 */
export interface CreateProofParams {
  userId: string;
  candidateName?: string;
  candidateEmail?: string;
  skillId: string;
  score: number;
  attemptId: string;
  verificationDate?: string;
}

/**
 * Portfolio summary metrics
 */
export interface PortfolioStatsDTO {
  totalVerifiedSkills: number;
  totalClaimedSkills: number;
  averageScore: number;
  activeDomainsCount: number;
  verificationRate: number;
}

/**
 * Complete Candidate Verification Portfolio
 */
export interface CandidatePortfolioDTO {
  userId: string;
  username: string;
  name: string;
  headline?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
  memberSince: string;
  stats: PortfolioStatsDTO;
  proofs: VerificationProofDTO[];
  domainBreakdown: DomainProgressDTO[];
  portfolioHash: string;
  lastUpdated: string;
}
