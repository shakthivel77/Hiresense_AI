import { Router, Request, Response } from 'express';
import { RankingService } from './rankingService.js';
import { LeaderboardQueryFilters, CompetencyTier } from './types.js';

export const rankingRouter = Router();
const rankingService = new RankingService();

/**
 * GET /api/ranking/my-score
 * Get competency score and breakdown for the authenticated user.
 */
rankingRouter.get('/my-score', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let userId = 'user-current';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token.startsWith('mock-token-')) {
        userId = token.replace('mock-token-', '');
      }
    }

    const score = rankingService.getCandidateScore(userId);
    return res.status(200).json({
      success: true,
      data: score,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SCORE_CALCULATION_ERROR', message: err.message || 'Failed to calculate score' },
    });
  }
});

/**
 * GET /api/ranking/score/:userId
 * Get competency score and breakdown for a specific candidate.
 */
rankingRouter.get('/score/:userId', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const score = rankingService.getCandidateScore(userId);
    return res.status(200).json({
      success: true,
      data: score,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'SCORE_QUERY_ERROR', message: err.message || 'Failed to fetch candidate score' },
    });
  }
});

/**
 * GET /api/ranking/leaderboard
 * Query global, domain, or institution leaderboards with optional tier and search filters.
 */
rankingRouter.get('/leaderboard', (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    let currentUserId: string | undefined = undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (token && token.startsWith('mock-token-')) {
        currentUserId = token.replace('mock-token-', '');
      }
    }

    const filters: LeaderboardQueryFilters = {
      scope: req.query.scope as 'global' | 'domain' | 'institution',
      domainSlug: req.query.domainSlug as string,
      institution: req.query.institution as string,
      tier: req.query.tier as CompetencyTier,
      search: req.query.search as string,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : 0,
    };

    const leaderboard = rankingService.getLeaderboard(filters, currentUserId);
    return res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'LEADERBOARD_QUERY_ERROR', message: err.message || 'Failed to fetch leaderboard' },
    });
  }
});

/**
 * GET /api/ranking/distribution
 * Get aggregate score distribution and tier statistics.
 */
rankingRouter.get('/distribution', (_req: Request, res: Response) => {
  try {
    const distribution = rankingService.getScoreDistribution();
    return res.status(200).json({
      success: true,
      data: distribution,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: { code: 'DISTRIBUTION_QUERY_ERROR', message: err.message || 'Failed to fetch distribution' },
    });
  }
});
