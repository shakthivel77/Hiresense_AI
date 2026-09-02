import { Router, Request, Response } from 'express';
import { resourceService } from './service.js';

const router = Router();

/**
 * GET /api/resources/:skillSlug
 * Returns curated learning resources for a given skill slug
 */
router.get('/:skillSlug', async (req: Request, res: Response) => {
  try {
    const skillSlug = req.params.skillSlug ? req.params.skillSlug.trim().toLowerCase() : '';
    if (!skillSlug) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'skillSlug parameter is required' },
      });
      return;
    }

    const resources = await resourceService.getResourcesForSkill(skillSlug);
    res.status(200).json({
      success: true,
      data: { resources },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Failed to retrieve skill resources' },
    });
  }
});

export default router;
export { router as resourcesRouter };
