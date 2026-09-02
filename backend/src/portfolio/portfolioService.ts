import { createHmac } from 'crypto';
import { CandidatePortfolioDTO, PortfolioStatsDTO } from './types.js';
import { userService } from '../users/service.js';
import { skillService } from '../skills/service.js';
import { proofService } from './proofService.js';

const PORTFOLIO_SECRET = process.env.PORTFOLIO_SECRET || 'hiresense_ai_portfolio_integrity_secret_2026';

export class PortfolioService {
  /**
   * Compiles the comprehensive Verified Candidate Portfolio document
   */
  public async compilePortfolio(userId: string): Promise<CandidatePortfolioDTO> {
    // 1. Candidate biographical info
    const profile = (await userService.getProfileByUserId(userId)) || {
      id: userId,
      email: 'candidate@hiresense.ai',
      displayName: 'Verified Candidate',
      role: 'student',
      institution: 'Computer Science',
      careerGoal: 'Software Engineer',
      githubUrl: '',
      linkedinUrl: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const username = (profile.displayName || profile.email.split('@')[0])
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '');

    // 2. Verified skill metrics & domain breakdown
    const verifiedProfile = await skillService.getVerifiedSkillProfile(userId);

    // 3. Cryptographic proof records
    const proofs = await proofService.getUserProofs(userId);

    // 4. Calculate stats
    const totalVerified = proofs.length > 0 ? proofs.length : verifiedProfile.totalVerifiedSkills;
    const scores = proofs.map((p) => p.score);
    const averageScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : totalVerified > 0
        ? 85.0
        : 0;

    const activeDomains = verifiedProfile.domainBreakdown.filter((d) => d.verifiedCount > 0);

    const stats: PortfolioStatsDTO = {
      totalVerifiedSkills: totalVerified,
      totalClaimedSkills: verifiedProfile.totalClaimedSkills,
      averageScore,
      activeDomainsCount: activeDomains.length,
      verificationRate: verifiedProfile.verificationRate,
    };

    // 5. Global portfolio integrity signature
    const now = new Date().toISOString();
    const proofSignatures = proofs.map((p) => `${p.skillId}:${p.score}:${p.verificationHash}`).join('|');
    const rawData = `${userId}:${username}:${totalVerified}:${averageScore}:${proofSignatures}`;
    const portfolioHash = createHmac('sha256', PORTFOLIO_SECRET).update(rawData).digest('hex');

    return {
      userId,
      username,
      name: profile.displayName,
      headline: profile.careerGoal || 'Software Engineer',
      bio: profile.institution ? `Student/Researcher at ${profile.institution}` : undefined,
      githubUrl: profile.githubUrl || undefined,
      linkedinUrl: profile.linkedinUrl || undefined,
      avatarUrl: undefined,
      memberSince: profile.createdAt,
      stats,
      proofs,
      domainBreakdown: verifiedProfile.domainBreakdown,
      portfolioHash,
      lastUpdated: now,
    };
  }

  /**
   * Resolve and compile public portfolio by candidate username
   */
  public async getPortfolioByUsername(username: string): Promise<CandidatePortfolioDTO | null> {
    const profile = await userService.getProfileByUsername(username);
    if (!profile) return null;
    return this.compilePortfolio(profile.id);
  }
}

export const portfolioService = new PortfolioService();
