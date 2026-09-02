import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/middleware.js';
import { AuthenticatedRequest } from '../auth/types.js';
import { portfolioService } from './portfolioService.js';
import { proofService } from './proofService.js';

const router = Router();

/**
 * GET /api/portfolio/me
 * Protected endpoint returning current user's compiled verification portfolio
 */
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      });
      return;
    }

    const portfolio = await portfolioService.compilePortfolio(userId);
    res.status(200).json({
      success: true,
      data: { portfolio },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to compile portfolio' },
    });
  }
});

/**
 * GET /api/portfolio/verify/:proofId
 * Public endpoint to verify cryptographic integrity of a proof artifact (recruiter verification)
 */
router.get('/verify/:proofId', async (req: Request, res: Response) => {
  try {
    const { proofId } = req.params;
    if (!proofId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'proofId parameter is required' },
      });
      return;
    }

    const proofCard = await proofService.getPublicProofCard(proofId);
    if (!proofCard) {
      res.status(404).json({
        success: false,
        error: {
          code: 'PROOF_NOT_FOUND',
          message: `Verification proof '${proofId}' not found or has been revoked.`,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { proofCard },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Verification lookup failed' },
    });
  }
});

/**
 * GET /api/portfolio/badge/:proofId
 * Public endpoint returning standalone SVG badge card for embeddings
 */
router.get(['/badge/:proofId', '/badge/:proofId.svg'], async (req: Request, res: Response) => {
  try {
    let { proofId } = req.params;
    if (proofId && proofId.endsWith('.svg')) {
      proofId = proofId.slice(0, -4);
    }

    if (!proofId) {
      res.status(400).send('proofId parameter required');
      return;
    }

    const proofCard = await proofService.getPublicProofCard(proofId);
    if (!proofCard || !proofCard.verified) {
      res.status(404).send('Verification proof not found or invalid');
      return;
    }

    const svg = proofService.generateProofBadgeSvg(proofCard);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).send(svg);
  } catch (error: any) {
    res.status(500).send('Failed to generate proof badge');
  }
});

/**
 * GET /api/portfolio/id/:userId
 * Public endpoint to retrieve candidate portfolio by User ID
 */
router.get('/id/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'userId parameter is required' },
      });
      return;
    }

    const portfolio = await portfolioService.compilePortfolio(userId);
    res.status(200).json({
      success: true,
      data: { portfolio },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to fetch candidate portfolio' },
    });
  }
});

/**
 * GET /api/portfolio/:username
 * Public vanity endpoint to retrieve candidate portfolio by username
 */
router.get('/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    if (!username) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'username parameter is required' },
      });
      return;
    }

    const portfolio = await portfolioService.getPortfolioByUsername(username);
    if (!portfolio) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Candidate portfolio for '@${username}' not found.` },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { portfolio },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to fetch public portfolio' },
    });
  }
});

export default router;
export { router as portfolioRouter };
