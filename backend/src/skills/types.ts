import { DomainDTO, RoadmapDTO, SkillDTO } from '../roadmap/types.js';

export type UserSkillStatus = 'CLAIMED' | 'UNVERIFIED' | 'VERIFIED';
export type ComputedSkillState = 'locked' | 'available' | 'in_progress' | 'verified';

export interface UserSkillDTO {
  id: string;
  userId: string;
  skillId: string;
  status: UserSkillStatus;
  verificationScore: number | null;
  verificationDate: string | null;
  attemptCount: number;
  lastAttemptAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSkillGraphNode {
  skill: SkillDTO;
  prerequisiteSkillIds: string[];
  dependentSkillIds: string[];
  userStatus: ComputedSkillState;
  userSkillRecord?: UserSkillDTO;
}

export interface UserRoadmapStateDTO {
  domain: DomainDTO;
  roadmap: RoadmapDTO;
  nodes: UserSkillGraphNode[];
  summary: {
    totalSkills: number;
    verifiedSkills: number;
    availableSkills: number;
    lockedSkills: number;
    inProgressSkills: number;
    progressPercentage: number;
  };
}

export interface VerifiedSkillItemDTO {
  skillId: string;
  skillName: string;
  category: string;
  difficulty: string;
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
