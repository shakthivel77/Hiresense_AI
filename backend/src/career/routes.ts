import { Router, Request, Response } from 'express';
import { jobPostingService } from './jobPostingService.js';
import { jobExtractorService } from './jobExtractorService.js';
import { jobMatchEngine } from './jobMatchEngine.js';
import { jobGapEngine } from './jobGapEngine.js';
import { CreateJobPostingInput } from './types.js';

const router = Router();

// Helper to resolve user ID from authorization header or demo fallback
function resolveUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // In dev / JWT decode mode, fallback to demo or parsed ID
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        if (payload.sub) return payload.sub;
        if (payload.id) return payload.id;
      }
    } catch (_) {}
  }
  return (req.query.userId as string) || (req.body?.userId as string) || 'demo-user-1';
}

/**
 * GET /api/career/jobs
 * List all available benchmark and custom job postings
 */
router.get('/jobs', async (_req: Request, res: Response) => {
  try {
    const jobs = await jobPostingService.getAllJobPostings();
    res.status(200).json({
      success: true,
      data: { jobs },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to list job postings' },
    });
  }
});

/**
 * GET /api/career/jobs/:jobId
 * Retrieve single job posting details
 */
router.get('/jobs/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await jobPostingService.getJobPostingById(jobId);
    if (!job) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Job posting '${jobId}' not found` },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { job },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to fetch job' },
    });
  }
});

/**
 * POST /api/career/jobs
 * Ingest and persist a new job posting
 */
router.post('/jobs', async (req: Request, res: Response) => {
  try {
    const input: CreateJobPostingInput = req.body;
    if (!input.title || !input.company || !input.rawDescription) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'title, company, and rawDescription are required fields.',
        },
      });
      return;
    }

    const job = await jobPostingService.createJobPosting(input);
    res.status(201).json({
      success: true,
      data: { job },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to create job posting' },
    });
  }
});

/**
 * POST /api/career/parse
 * Extract and classify requirements from raw job description on the fly
 */
router.post('/parse', async (req: Request, res: Response) => {
  try {
    const { rawDescription, domainSlug } = req.body;
    if (!rawDescription || typeof rawDescription !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'rawDescription string is required.' },
      });
      return;
    }

    const result = jobExtractorService.extractSkillsFromText(rawDescription, domainSlug);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to parse job text' },
    });
  }
});

/**
 * POST /api/career/match/:jobId
 * Calculate deterministic match and gap analysis for user against a stored job posting
 */
router.post('/match/:jobId', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const userId = resolveUserId(req);

    const job = await jobPostingService.getJobPostingById(jobId);
    if (!job) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Job posting '${jobId}' not found` },
      });
      return;
    }

    const matchAnalysis = await jobMatchEngine.calculateJobMatch(userId, job);
    const gapAnalysis = await jobGapEngine.generateGapAnalysis(userId, matchAnalysis);

    res.status(200).json({
      success: true,
      data: gapAnalysis,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Match analysis failed' },
    });
  }
});

/**
 * POST /api/career/match-text
 * Calculate deterministic match and gap analysis for user against raw pasted text
 */
router.post('/match-text', async (req: Request, res: Response) => {
  try {
    const { rawDescription, domainSlug } = req.body;
    if (!rawDescription || typeof rawDescription !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'rawDescription string is required.' },
      });
      return;
    }

    const userId = resolveUserId(req);
    const matchAnalysis = await jobMatchEngine.calculateMatchFromText(userId, rawDescription, domainSlug);
    const gapAnalysis = await jobGapEngine.generateGapAnalysis(userId, matchAnalysis);

    res.status(200).json({
      success: true,
      data: gapAnalysis,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Match text analysis failed' },
    });
  }
});

export default router;
export { router as careerRouter };
