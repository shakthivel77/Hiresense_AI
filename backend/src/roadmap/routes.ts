import { Router, Request, Response } from 'express';
import { roadmapService } from './service.js';

const router = Router();

/**
 * GET /api/roadmap/domains
 * Public endpoint to list all available learning domains
 */
router.get('/domains', async (_req: Request, res: Response) => {
  try {
    const domains = await roadmapService.getDomains();
    res.status(200).json({
      success: true,
      data: { domains },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve domain list',
      },
    });
  }
});

/**
 * GET /api/roadmap/:domainSlug
 * Public endpoint to fetch full roadmap graph for a given domain slug
 */
router.get('/:domainSlug', async (req: Request, res: Response) => {
  try {
    const domainSlug = req.params.domainSlug ? req.params.domainSlug.trim().toLowerCase() : '';
    if (!domainSlug) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Domain slug parameter is required',
        },
      });
      return;
    }

    const graph = await roadmapService.getRoadmapGraph(domainSlug);
    if (!graph) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Roadmap graph not found for domain '${domainSlug}'`,
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: graph,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve roadmap graph',
      },
    });
  }
});

export default router;
export { router as roadmapRouter };
