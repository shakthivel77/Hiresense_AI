export type SkillDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type SkillStatus = 'locked' | 'available' | 'in_progress' | 'verified';

export interface DomainDTO {
  id: string;
  slug: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface RoadmapDTO {
  id: string;
  domainId: string;
  title: string;
  version: string;
  description?: string;
  createdAt?: string;
}

export interface SkillDTO {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  difficulty: SkillDifficulty;
  createdAt?: string;
}

export interface UserSkillRecord {
  id: string;
  userId: string;
  skillId: string;
  status: 'CLAIMED' | 'UNVERIFIED' | 'VERIFIED';
  verificationScore: number | null;
  verificationDate: string | null;
  attemptCount: number;
  lastAttemptAt: string | null;
}

export interface SkillGraphNode {
  skill: SkillDTO;
  prerequisiteSkillIds: string[];
  dependentSkillIds: string[];
  status?: SkillStatus;
  userStatus?: SkillStatus;
  userSkillRecord?: UserSkillRecord;
}

export interface UserSkillSummary {
  totalSkills: number;
  verifiedSkills: number;
  availableSkills: number;
  lockedSkills: number;
  inProgressSkills: number;
  progressPercentage: number;
}

export interface RoadmapGraphData {
  domain: DomainDTO;
  roadmap: RoadmapDTO;
  nodes: SkillGraphNode[];
  summary?: UserSkillSummary;
}

export interface DomainsResponse {
  success: boolean;
  data: {
    domains: DomainDTO[];
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface RoadmapGraphResponse {
  success: boolean;
  data: RoadmapGraphData;
  error?: {
    code: string;
    message: string;
  };
}

export interface VerifiedSkillItemDTO {
  skillId: string;
  skillName: string;
  category: string;
  difficulty: SkillDifficulty;
  verificationScore: number;
  verificationDate: string;
}

export interface DomainProgressDTO {
  domainSlug: string;
  domainTitle: string;
  verifiedCount: number;
  totalCount: number;
  completionPercentage: number;
}

export interface VerifiedSkillProfileDTO {
  userId: string;
  totalVerifiedSkills: number;
  totalClaimedSkills: number;
  verificationRate: number;
  verifiedSkills: VerifiedSkillItemDTO[];
  domainBreakdown: DomainProgressDTO[];
}
