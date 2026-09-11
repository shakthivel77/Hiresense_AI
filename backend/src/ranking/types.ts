export type CompetencyTier = 'NOVICE' | 'APPRENTICE' | 'PROFICIENT' | 'EXPERT' | 'MASTER';

export type SkillDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface VerifiedSkillScoreInput {
  skillId: string;
  skillName: string;
  category: string;
  difficulty: SkillDifficulty;
  verificationScore: number; // 80 - 100
  verificationDate?: string | null;
}

export interface DomainCoverageInput {
  domainSlug: string;
  domainName: string;
  totalSkillsCount: number;
  verifiedSkillsCount: number;
}

export interface InterviewSessionScoreInput {
  sessionId: string;
  overallScore: number; // 0 - 100
  completedAt?: string | null;
}

export interface CompetencyScoreInput {
  userId: string;
  verifiedSkills: VerifiedSkillScoreInput[];
  domainCoverage?: DomainCoverageInput | null;
  interviewSessions?: InterviewSessionScoreInput[];
  completedProjectsCount?: number;
}

export interface ComponentMetric {
  rawScore: number; // 0 - 100
  weight: number; // e.g. 0.40
  weightedScore: number; // rawScore * weight
}

export interface ScoreComponentBreakdown {
  skillMastery: ComponentMetric & {
    verifiedSkillsCount: number;
    averageScore: number;
  };
  skillDifficulty: ComponentMetric & {
    beginnerCount: number;
    intermediateCount: number;
    advancedCount: number;
    difficultyRatio: number;
  };
  domainCoverage: ComponentMetric & {
    domainSlug: string;
    verifiedInDomain: number;
    totalInDomain: number;
    coveragePercentage: number;
  };
  projectPerformance: ComponentMetric & {
    completedProjects: number;
    advancedSkillBonus: number;
  };
  interviewPerformance: ComponentMetric & {
    sessionsCount: number;
    averageInterviewScore: number;
    hasInterviewData: boolean;
  };
}

export interface UserCompetencyScoreDTO {
  userId: string;
  compositeScore: number; // 0 - 100
  tier: CompetencyTier;
  components: ScoreComponentBreakdown;
  calculatedAt: string;
}

export interface LeaderboardEntryDTO {
  rank: number;
  userId: string;
  displayName: string;
  role: string;
  institution?: string | null;
  primaryDomain?: string;
  compositeScore: number;
  tier: CompetencyTier;
  verifiedSkillsCount: number;
  completedInterviewsCount: number;
  completedProjectsCount: number;
}

export interface LeaderboardQueryFilters {
  scope?: 'global' | 'domain' | 'institution';
  domainSlug?: string;
  institution?: string;
  tier?: CompetencyTier;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface LeaderboardResponseDTO {
  scope: string;
  totalEntries: number;
  entries: LeaderboardEntryDTO[];
  userRank?: LeaderboardEntryDTO | null;
  page: number;
  pageSize: number;
}

export interface ScoreDistributionDTO {
  totalScoredCandidates: number;
  averageGlobalScore: number;
  tierDistribution: Record<CompetencyTier, number>;
  topInstitutions: Array<{ institution: string; candidateCount: number; averageScore: number }>;
  topDomains: Array<{ domainSlug: string; domainName: string; candidateCount: number; averageScore: number }>;
}
