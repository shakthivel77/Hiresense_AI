export type CompetencyTier = 'NOVICE' | 'APPRENTICE' | 'PROFICIENT' | 'EXPERT' | 'MASTER';

export interface ComponentMetric {
  rawScore: number;
  weight: number;
  weightedScore: number;
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

export interface UserCompetencyScore {
  userId: string;
  compositeScore: number;
  tier: CompetencyTier;
  components: ScoreComponentBreakdown;
  calculatedAt: string;
}

export interface LeaderboardEntry {
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

export interface LeaderboardResponse {
  scope: string;
  totalEntries: number;
  entries: LeaderboardEntry[];
  userRank?: LeaderboardEntry | null;
  page: number;
  pageSize: number;
}

export interface ScoreDistribution {
  totalScoredCandidates: number;
  averageGlobalScore: number;
  tierDistribution: Record<CompetencyTier, number>;
  topInstitutions: Array<{ institution: string; candidateCount: number; averageScore: number }>;
  topDomains: Array<{ domainSlug: string; domainName: string; candidateCount: number; averageScore: number }>;
}

export async function fetchMyCompetencyScore(token?: string | null): Promise<UserCompetencyScore> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/ranking/my-score', { headers });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to fetch user competency score');
  }
  return data.data;
}

export async function fetchLeaderboard(
  params: {
    scope?: string;
    domainSlug?: string;
    institution?: string;
    tier?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {},
  token?: string | null
): Promise<LeaderboardResponse> {
  const query = new URLSearchParams();
  if (params.scope) query.set('scope', params.scope);
  if (params.domainSlug) query.set('domainSlug', params.domainSlug);
  if (params.institution) query.set('institution', params.institution);
  if (params.tier) query.set('tier', params.tier);
  if (params.search) query.set('search', params.search);
  if (params.limit) query.set('limit', params.limit.toString());
  if (params.offset) query.set('offset', params.offset.toString());

  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api/ranking/leaderboard?${query.toString()}`, { headers });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to fetch leaderboard');
  }
  return data.data;
}

export async function fetchScoreDistribution(): Promise<ScoreDistribution> {
  const res = await fetch('/api/ranking/distribution');
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to fetch score distribution');
  }
  return data.data;
}

export async function fetchUserCompetencyScore(userId: string): Promise<UserCompetencyScore> {
  const res = await fetch(`/api/ranking/score/${userId}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to fetch candidate score');
  }
  return data.data;
}

