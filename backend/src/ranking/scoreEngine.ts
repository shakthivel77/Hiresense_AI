import {
  CompetencyScoreInput,
  UserCompetencyScoreDTO,
  ScoreComponentBreakdown,
  CompetencyTier,
} from './types.js';

export class ScoreEngine {
  private static readonly WEIGHTS = {
    SKILL_MASTERY: 0.40,
    SKILL_DIFFICULTY: 0.20,
    DOMAIN_COVERAGE: 0.15,
    PROJECT_PERFORMANCE: 0.15,
    INTERVIEW_PERFORMANCE: 0.10,
  };

  /**
   * Compute the deterministic composite Hiresense Competency Score and component breakdown.
   */
  public static calculateCompetencyScore(input: CompetencyScoreInput): UserCompetencyScoreDTO {
    const verified = input.verifiedSkills || [];
    const verifiedCount = verified.length;

    // 1. Skill Mastery Component (40%)
    let masteryRaw = 0;
    if (verifiedCount > 0) {
      const totalScore = verified.reduce((sum, s) => sum + (s.verificationScore || 80), 0);
      masteryRaw = Math.min(100, Math.max(0, totalScore / verifiedCount));
    }
    const masteryWeighted = Math.round(masteryRaw * this.WEIGHTS.SKILL_MASTERY * 100) / 100;

    // 2. Skill Difficulty Component (20%)
    let beginnerCount = 0;
    let intermediateCount = 0;
    let advancedCount = 0;

    verified.forEach((s) => {
      if (s.difficulty === 'advanced') advancedCount++;
      else if (s.difficulty === 'intermediate') intermediateCount++;
      else beginnerCount++;
    });

    let difficultyRaw = 0;
    let difficultyRatio = 0;
    if (verifiedCount > 0) {
      // Beginner: 1.0, Intermediate: 1.5, Advanced: 2.0
      const weightedSum = beginnerCount * 1.0 + intermediateCount * 1.5 + advancedCount * 2.0;
      const maxPossible = verifiedCount * 2.0;
      difficultyRatio = maxPossible > 0 ? weightedSum / maxPossible : 0;
      difficultyRaw = Math.min(100, Math.max(0, difficultyRatio * 100));
    }
    const difficultyWeighted = Math.round(difficultyRaw * this.WEIGHTS.SKILL_DIFFICULTY * 100) / 100;

    // 3. Domain Coverage Component (15%)
    let coverageRaw = 0;
    let domainSlug = 'general';
    let totalInDomain = 0;
    let verifiedInDomain = 0;

    if (input.domainCoverage && input.domainCoverage.totalSkillsCount > 0) {
      domainSlug = input.domainCoverage.domainSlug;
      totalInDomain = input.domainCoverage.totalSkillsCount;
      verifiedInDomain = input.domainCoverage.verifiedSkillsCount;
      coverageRaw = Math.min(100, Math.max(0, (verifiedInDomain / totalInDomain) * 100));
    } else if (verifiedCount > 0) {
      // Baseline domain fallback (10 skills = 100%)
      totalInDomain = 10;
      verifiedInDomain = Math.min(verifiedCount, 10);
      coverageRaw = Math.min(100, (verifiedCount / 10) * 100);
    }
    const coverageWeighted = Math.round(coverageRaw * this.WEIGHTS.DOMAIN_COVERAGE * 100) / 100;

    // 4. Project Performance Component (15%)
    const completedProjects = input.completedProjectsCount || 0;
    const projectBase = Math.min(75, completedProjects * 25);
    const advancedSkillBonus = Math.min(25, advancedCount * 10 + intermediateCount * 3);
    const projectRaw = Math.min(100, Math.max(0, projectBase + advancedSkillBonus));
    const projectWeighted = Math.round(projectRaw * this.WEIGHTS.PROJECT_PERFORMANCE * 100) / 100;

    // 5. Interview Performance Component (10%)
    const interviewSessions = input.interviewSessions || [];
    let interviewRaw = 0;
    const hasInterviewData = interviewSessions.length > 0;

    if (hasInterviewData) {
      const interviewTotal = interviewSessions.reduce((sum, i) => sum + (i.overallScore || 0), 0);
      interviewRaw = Math.min(100, Math.max(0, interviewTotal / interviewSessions.length));
    } else if (verifiedCount > 0) {
      // Deterministic unpracticed interview fallback based on verified mastery
      interviewRaw = Math.min(100, Math.round(masteryRaw * 0.70));
    }
    const interviewWeighted = Math.round(interviewRaw * this.WEIGHTS.INTERVIEW_PERFORMANCE * 100) / 100;

    // Composite Score calculation
    const rawComposite =
      masteryWeighted +
      difficultyWeighted +
      coverageWeighted +
      projectWeighted +
      interviewWeighted;

    const compositeScore = Math.min(100, Math.max(0, Math.round(rawComposite * 100) / 100));
    const tier = this.determineTier(compositeScore);

    const components: ScoreComponentBreakdown = {
      skillMastery: {
        rawScore: Math.round(masteryRaw * 100) / 100,
        weight: this.WEIGHTS.SKILL_MASTERY,
        weightedScore: masteryWeighted,
        verifiedSkillsCount: verifiedCount,
        averageScore: Math.round(masteryRaw * 100) / 100,
      },
      skillDifficulty: {
        rawScore: Math.round(difficultyRaw * 100) / 100,
        weight: this.WEIGHTS.SKILL_DIFFICULTY,
        weightedScore: difficultyWeighted,
        beginnerCount,
        intermediateCount,
        advancedCount,
        difficultyRatio: Math.round(difficultyRatio * 100) / 100,
      },
      domainCoverage: {
        rawScore: Math.round(coverageRaw * 100) / 100,
        weight: this.WEIGHTS.DOMAIN_COVERAGE,
        weightedScore: coverageWeighted,
        domainSlug,
        verifiedInDomain,
        totalInDomain,
        coveragePercentage: Math.round(coverageRaw * 100) / 100,
      },
      projectPerformance: {
        rawScore: Math.round(projectRaw * 100) / 100,
        weight: this.WEIGHTS.PROJECT_PERFORMANCE,
        weightedScore: projectWeighted,
        completedProjects,
        advancedSkillBonus,
      },
      interviewPerformance: {
        rawScore: Math.round(interviewRaw * 100) / 100,
        weight: this.WEIGHTS.INTERVIEW_PERFORMANCE,
        weightedScore: interviewWeighted,
        sessionsCount: interviewSessions.length,
        averageInterviewScore: Math.round(interviewRaw * 100) / 100,
        hasInterviewData,
      },
    };

    return {
      userId: input.userId,
      compositeScore,
      tier,
      components,
      calculatedAt: new Date().toISOString(),
    };
  }

  /**
   * Determine competency tier from composite score
   */
  public static determineTier(score: number): CompetencyTier {
    if (score >= 90.0) return 'MASTER';
    if (score >= 75.0) return 'EXPERT';
    if (score >= 60.0) return 'PROFICIENT';
    if (score >= 40.0) return 'APPRENTICE';
    return 'NOVICE';
  }
}
