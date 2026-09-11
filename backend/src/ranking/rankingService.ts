import {
  CompetencyScoreInput,
  UserCompetencyScoreDTO,
  LeaderboardEntryDTO,
  LeaderboardQueryFilters,
  LeaderboardResponseDTO,
  ScoreDistributionDTO,
  CompetencyTier,
} from './types.js';
import { ScoreEngine } from './scoreEngine.js';

interface CandidateProfileRecord {
  userId: string;
  displayName: string;
  role: string;
  institution: string;
  primaryDomain: string;
  input: CompetencyScoreInput;
  calculatedScore?: UserCompetencyScoreDTO;
}

export class RankingService {
  private candidateProfiles = new Map<string, CandidateProfileRecord>();

  constructor() {
    this.seedBenchmarkProfiles();
  }

  /**
   * Seed authentic benchmark candidate profiles across various domains & institutions
   */
  private seedBenchmarkProfiles(): void {
    const seedData: Array<{
      userId: string;
      displayName: string;
      role: string;
      institution: string;
      primaryDomain: string;
      completedProjectsCount: number;
      skills: Array<{
        skillId: string;
        skillName: string;
        category: string;
        difficulty: 'beginner' | 'intermediate' | 'advanced';
        verificationScore: number;
      }>;
      domainCoverage: {
        domainSlug: string;
        domainName: string;
        totalSkillsCount: number;
        verifiedSkillsCount: number;
      };
      interviews: Array<{ sessionId: string; overallScore: number }>;
    }> = [
      {
        userId: 'cand-001',
        displayName: 'Priya Sharma',
        role: 'student',
        institution: 'IIT Madras',
        primaryDomain: 'backend-developer',
        completedProjectsCount: 3,
        skills: [
          { skillId: 's1', skillName: 'Node.js Architecture', category: 'Backend Core', difficulty: 'intermediate', verificationScore: 94 },
          { skillId: 's2', skillName: 'PostgreSQL Indexing', category: 'Databases', difficulty: 'advanced', verificationScore: 96 },
          { skillId: 's3', skillName: 'REST API Security', category: 'Security', difficulty: 'advanced', verificationScore: 92 },
          { skillId: 's4', skillName: 'Redis Caching', category: 'Databases', difficulty: 'intermediate', verificationScore: 90 },
          { skillId: 's5', skillName: 'Docker Containerization', category: 'DevOps', difficulty: 'intermediate', verificationScore: 88 },
        ],
        domainCoverage: { domainSlug: 'backend-developer', domainName: 'Backend Developer', totalSkillsCount: 6, verifiedSkillsCount: 5 },
        interviews: [{ sessionId: 'int-1', overallScore: 95 }, { sessionId: 'int-2', overallScore: 92 }],
      },
      {
        userId: 'cand-002',
        displayName: 'Alex Chen',
        role: 'student',
        institution: 'Stanford University',
        primaryDomain: 'ai-data-engineer',
        completedProjectsCount: 2,
        skills: [
          { skillId: 's6', skillName: 'Python for Data Science', category: 'Core Languages', difficulty: 'beginner', verificationScore: 98 },
          { skillId: 's7', skillName: 'PyTorch Deep Learning', category: 'Machine Learning', difficulty: 'advanced', verificationScore: 92 },
          { skillId: 's8', skillName: 'Data Pipeline Engineering', category: 'Data Ops', difficulty: 'advanced', verificationScore: 90 },
          { skillId: 's9', skillName: 'Vector Embeddings', category: 'AI Architecture', difficulty: 'advanced', verificationScore: 94 },
        ],
        domainCoverage: { domainSlug: 'ai-data-engineer', domainName: 'AI & Data Engineer', totalSkillsCount: 5, verifiedSkillsCount: 4 },
        interviews: [{ sessionId: 'int-3', overallScore: 91 }],
      },
      {
        userId: 'cand-003',
        displayName: 'Marcus Vance',
        role: 'professional',
        institution: 'MIT',
        primaryDomain: 'frontend-developer',
        completedProjectsCount: 3,
        skills: [
          { skillId: 's10', skillName: 'React State Management', category: 'Frontend Core', difficulty: 'intermediate', verificationScore: 96 },
          { skillId: 's11', skillName: 'TypeScript Strict Patterns', category: 'Languages', difficulty: 'intermediate', verificationScore: 94 },
          { skillId: 's12', skillName: 'Web Performance Optimization', category: 'Performance', difficulty: 'advanced', verificationScore: 90 },
          { skillId: 's13', skillName: 'Tailwind CSS Design Systems', category: 'UI/UX', difficulty: 'beginner', verificationScore: 92 },
        ],
        domainCoverage: { domainSlug: 'frontend-developer', domainName: 'Frontend Developer', totalSkillsCount: 5, verifiedSkillsCount: 4 },
        interviews: [{ sessionId: 'int-4', overallScore: 89 }],
      },
      {
        userId: 'cand-004',
        displayName: 'Elena Rostova',
        role: 'student',
        institution: 'University of Oxford',
        primaryDomain: 'backend-developer',
        completedProjectsCount: 2,
        skills: [
          { skillId: 's1', skillName: 'Node.js Architecture', category: 'Backend Core', difficulty: 'intermediate', verificationScore: 88 },
          { skillId: 's2', skillName: 'PostgreSQL Indexing', category: 'Databases', difficulty: 'advanced', verificationScore: 86 },
          { skillId: 's14', skillName: 'Authentication & JWT', category: 'Security', difficulty: 'intermediate', verificationScore: 90 },
        ],
        domainCoverage: { domainSlug: 'backend-developer', domainName: 'Backend Developer', totalSkillsCount: 6, verifiedSkillsCount: 3 },
        interviews: [{ sessionId: 'int-5', overallScore: 84 }],
      },
      {
        userId: 'cand-005',
        displayName: 'Aarav Patel',
        role: 'student',
        institution: 'Anna University',
        primaryDomain: 'frontend-developer',
        completedProjectsCount: 1,
        skills: [
          { skillId: 's10', skillName: 'React State Management', category: 'Frontend Core', difficulty: 'intermediate', verificationScore: 85 },
          { skillId: 's11', skillName: 'TypeScript Strict Patterns', category: 'Languages', difficulty: 'intermediate', verificationScore: 84 },
        ],
        domainCoverage: { domainSlug: 'frontend-developer', domainName: 'Frontend Developer', totalSkillsCount: 5, verifiedSkillsCount: 2 },
        interviews: [{ sessionId: 'int-6', overallScore: 82 }],
      },
      {
        userId: 'cand-006',
        displayName: 'Devon Miller',
        role: 'student',
        institution: 'UC Berkeley',
        primaryDomain: 'backend-developer',
        completedProjectsCount: 1,
        skills: [
          { skillId: 's1', skillName: 'Node.js Architecture', category: 'Backend Core', difficulty: 'intermediate', verificationScore: 82 },
          { skillId: 's14', skillName: 'Authentication & JWT', category: 'Security', difficulty: 'intermediate', verificationScore: 80 },
        ],
        domainCoverage: { domainSlug: 'backend-developer', domainName: 'Backend Developer', totalSkillsCount: 6, verifiedSkillsCount: 2 },
        interviews: [],
      },
    ];

    seedData.forEach((item) => {
      const input: CompetencyScoreInput = {
        userId: item.userId,
        verifiedSkills: item.skills,
        domainCoverage: item.domainCoverage,
        interviewSessions: item.interviews,
        completedProjectsCount: item.completedProjectsCount,
      };

      const calculatedScore = ScoreEngine.calculateCompetencyScore(input);

      this.candidateProfiles.set(item.userId, {
        userId: item.userId,
        displayName: item.displayName,
        role: item.role,
        institution: item.institution,
        primaryDomain: item.primaryDomain,
        input,
        calculatedScore,
      });
    });
  }

  /**
   * Register or synchronize a live candidate's score into the ranking store.
   */
  public registerOrUpdateCandidate(
    userId: string,
    displayName: string,
    role: string,
    institution: string | undefined,
    primaryDomain: string | undefined,
    scoreInput: CompetencyScoreInput
  ): UserCompetencyScoreDTO {
    const calculatedScore = ScoreEngine.calculateCompetencyScore(scoreInput);

    this.candidateProfiles.set(userId, {
      userId,
      displayName,
      role: role || 'student',
      institution: institution || 'Independent Learner',
      primaryDomain: primaryDomain || 'backend-developer',
      input: scoreInput,
      calculatedScore,
    });

    return calculatedScore;
  }

  /**
   * Get competency score and detailed component breakdown for a user.
   */
  public getCandidateScore(userId: string): UserCompetencyScoreDTO {
    const profile = this.candidateProfiles.get(userId);
    if (profile && profile.calculatedScore) {
      return profile.calculatedScore;
    }

    // Default fallback calculation for new candidate
    return ScoreEngine.calculateCompetencyScore({
      userId,
      verifiedSkills: [],
      completedProjectsCount: 0,
      interviewSessions: [],
    });
  }

  /**
   * Query leaderboard entries with multi-scope filtering and pagination.
   */
  public getLeaderboard(
    filters: LeaderboardQueryFilters = {},
    currentUserId?: string
  ): LeaderboardResponseDTO {
    const scope = filters.scope || 'global';
    const limit = Math.min(Math.max(filters.limit || 50, 1), 100);
    const offset = Math.max(filters.offset || 0, 0);

    let candidates = Array.from(this.candidateProfiles.values());

    // 1. Filter by Domain if scope is domain or domainSlug specified
    if (filters.domainSlug) {
      candidates = candidates.filter(
        (c) => c.primaryDomain.toLowerCase() === filters.domainSlug!.toLowerCase()
      );
    }

    // 2. Filter by Institution if scope is institution or institution specified
    if (filters.institution) {
      candidates = candidates.filter(
        (c) => c.institution.toLowerCase().includes(filters.institution!.toLowerCase())
      );
    }

    // 3. Filter by Tier if specified
    if (filters.tier) {
      candidates = candidates.filter(
        (c) => c.calculatedScore?.tier === filters.tier
      );
    }

    // 4. Text Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      candidates = candidates.filter(
        (c) =>
          c.displayName.toLowerCase().includes(q) ||
          c.institution.toLowerCase().includes(q) ||
          c.primaryDomain.toLowerCase().includes(q)
      );
    }

    // 5. Deterministic Ranking Sort
    // Order: compositeScore DESC -> verifiedSkillsCount DESC -> displayName ASC
    candidates.sort((a, b) => {
      const scoreA = a.calculatedScore?.compositeScore || 0;
      const scoreB = b.calculatedScore?.compositeScore || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;

      const skillsA = a.input.verifiedSkills.length;
      const skillsB = b.input.verifiedSkills.length;
      if (skillsB !== skillsA) return skillsB - skillsA;

      return a.displayName.localeCompare(b.displayName);
    });

    const totalEntries = candidates.length;

    // 6. Map to DTO with 1-indexed ranks
    const allRankedEntries: LeaderboardEntryDTO[] = candidates.map((c, index) => ({
      rank: index + 1,
      userId: c.userId,
      displayName: c.displayName,
      role: c.role,
      institution: c.institution,
      primaryDomain: c.primaryDomain,
      compositeScore: c.calculatedScore?.compositeScore || 0,
      tier: c.calculatedScore?.tier || 'NOVICE',
      verifiedSkillsCount: c.input.verifiedSkills.length,
      completedInterviewsCount: c.input.interviewSessions?.length || 0,
      completedProjectsCount: c.input.completedProjectsCount || 0,
    }));

    // Find current user's entry in full ranked list
    const userRank = currentUserId
      ? allRankedEntries.find((e) => e.userId === currentUserId) || null
      : null;

    // Apply pagination slice
    const paginatedEntries = allRankedEntries.slice(offset, offset + limit);

    return {
      scope,
      totalEntries,
      entries: paginatedEntries,
      userRank,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
    };
  }

  /**
   * Get aggregate distribution analytics
   */
  public getScoreDistribution(): ScoreDistributionDTO {
    const candidates = Array.from(this.candidateProfiles.values());
    const totalScoredCandidates = candidates.length;

    const tierDistribution: Record<CompetencyTier, number> = {
      NOVICE: 0,
      APPRENTICE: 0,
      PROFICIENT: 0,
      EXPERT: 0,
      MASTER: 0,
    };

    let totalScore = 0;
    const institutionStats = new Map<string, { count: number; totalScore: number }>();
    const domainStats = new Map<string, { count: number; totalScore: number }>();

    candidates.forEach((c) => {
      const score = c.calculatedScore?.compositeScore || 0;
      const tier = c.calculatedScore?.tier || 'NOVICE';
      tierDistribution[tier] = (tierDistribution[tier] || 0) + 1;
      totalScore += score;

      // Institution aggregation
      if (c.institution) {
        const inst = institutionStats.get(c.institution) || { count: 0, totalScore: 0 };
        inst.count++;
        inst.totalScore += score;
        institutionStats.set(c.institution, inst);
      }

      // Domain aggregation
      if (c.primaryDomain) {
        const dom = domainStats.get(c.primaryDomain) || { count: 0, totalScore: 0 };
        dom.count++;
        dom.totalScore += score;
        domainStats.set(c.primaryDomain, dom);
      }
    });

    const averageGlobalScore =
      totalScoredCandidates > 0 ? Math.round((totalScore / totalScoredCandidates) * 100) / 100 : 0;

    const topInstitutions = Array.from(institutionStats.entries())
      .map(([institution, data]) => ({
        institution,
        candidateCount: data.count,
        averageScore: Math.round((data.totalScore / data.count) * 100) / 100,
      }))
      .sort((a, b) => b.averageScore - a.averageScore);

    const topDomains = Array.from(domainStats.entries())
      .map(([domainSlug, data]) => ({
        domainSlug,
        domainName: domainSlug.replace('-', ' ').toUpperCase(),
        candidateCount: data.count,
        averageScore: Math.round((data.totalScore / data.count) * 100) / 100,
      }))
      .sort((a, b) => b.averageScore - a.averageScore);

    return {
      totalScoredCandidates,
      averageGlobalScore,
      tierDistribution,
      topInstitutions,
      topDomains,
    };
  }
}
