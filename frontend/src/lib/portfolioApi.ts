import { DomainProgressDTO } from '../types/roadmap';

export interface VerificationProof {
  id: string;
  proofId: string;
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
  verificationHash: string;
  issuer: string;
  status: 'VALID' | 'REVOKED';
  proofUrl: string;
}

export interface PublicProofCard {
  proofId: string;
  candidateName: string;
  skillName: string;
  category: string;
  difficulty: string;
  score: number;
  verificationDate: string;
  verificationHash: string;
  issuer: string;
  status: 'VALID' | 'REVOKED';
  verified: boolean;
}

export interface PortfolioStats {
  totalVerifiedSkills: number;
  totalClaimedSkills: number;
  averageScore: number;
  activeDomainsCount: number;
  verificationRate: number;
}

export interface CandidatePortfolio {
  userId: string;
  username: string;
  name: string;
  headline?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  avatarUrl?: string;
  memberSince: string;
  stats: PortfolioStats;
  proofs: VerificationProof[];
  domainBreakdown: DomainProgressDTO[];
  portfolioHash: string;
  lastUpdated: string;
}

export async function fetchMyPortfolio(token: string): Promise<CandidatePortfolio> {
  const res = await fetch('/api/portfolio/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load portfolio: HTTP ${res.status}`);
  }

  const json = await res.json();
  if (!json.success || !json.data?.portfolio) {
    throw new Error(json.error?.message || 'Failed to parse portfolio response');
  }

  return json.data.portfolio;
}

export async function fetchPublicPortfolio(username: string): Promise<CandidatePortfolio> {
  const cleanUsername = username.replace(/^@/, '').trim();
  const res = await fetch(`/api/portfolio/${encodeURIComponent(cleanUsername)}`);

  if (!res.ok) {
    throw new Error(`Candidate '@${cleanUsername}' not found or profile is unavailable.`);
  }

  const json = await res.json();
  if (!json.success || !json.data?.portfolio) {
    throw new Error(json.error?.message || 'Failed to load public portfolio');
  }

  return json.data.portfolio;
}

export async function verifyProof(proofId: string): Promise<PublicProofCard> {
  const cleanId = proofId.trim();
  const res = await fetch(`/api/portfolio/verify/${encodeURIComponent(cleanId)}`);

  if (!res.ok) {
    throw new Error(`Verification proof '${cleanId}' could not be verified.`);
  }

  const json = await res.json();
  if (!json.success || !json.data?.proofCard) {
    throw new Error(json.error?.message || 'Invalid verification response');
  }

  return json.data.proofCard;
}
