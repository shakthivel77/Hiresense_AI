import { Router, Response } from 'express';
import { requireAuth } from '../auth/middleware.js';
import { AuthenticatedRequest } from '../auth/types.js';
import { skillService } from './service.js';

const router = Router();

/**
 * GET /api/skills/roadmap/:domainSlug
 * Protected endpoint returning personalized prerequisite-evaluated roadmap graph for the current user
 */
router.get('/roadmap/:domainSlug', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      });
      return;
    }

    const domainSlug = req.params.domainSlug ? req.params.domainSlug.trim().toLowerCase() : '';
    if (!domainSlug) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Domain slug parameter is required' },
      });
      return;
    }

    const roadmapState = await skillService.getUserRoadmapState(userId, domainSlug);
    if (!roadmapState) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Roadmap graph not found for domain '${domainSlug}'` },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: roadmapState,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to compute user roadmap state' },
    });
  }
});

/**
 * GET /api/skills/my-skills
 * Protected endpoint returning all skill records for the authenticated user
 */
router.get('/my-skills', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      });
      return;
    }

    const skills = await skillService.getUserSkills(userId);
    res.status(200).json({
      success: true,
      data: { skills },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve user skills' },
    });
  }
});

/**
 * POST /api/skills/claim
 * Protected endpoint to declare a skill (creates CLAIMED/UNVERIFIED record, NEVER verified)
 */
router.post('/claim', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      });
      return;
    }

    const { skillId } = req.body;
    if (!skillId || typeof skillId !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'skillId is required' },
      });
      return;
    }

    const record = await skillService.claimSkill(userId, skillId.trim());
    res.status(200).json({
      success: true,
      data: { userSkill: record },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to record skill claim' },
    });
  }
});

/**
 * GET /api/skills/verified-profile
 * Protected endpoint returning the candidate's aggregated Verified Skill Profile
 */
router.get('/verified-profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
      });
      return;
    }

    const profile = await skillService.getVerifiedSkillProfile(userId);
    res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to aggregate verified profile' },
    });
  }
});

export default router;
export { router as skillsRouter };
