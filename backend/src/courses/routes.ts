import { Router, Response } from 'express';
import { requireAuth, requireRole } from '../auth/middleware.js';
import { AuthenticatedRequest } from '../auth/types.js';
import { courseService } from './service.js';

export const coursesRouter = Router();

// ============================================================================
// Learner / Public Course Consumption Endpoints
// ============================================================================

/**
 * GET /api/courses
 * List published courses (or filter by domainSlug)
 */
coursesRouter.get('/', async (req, res: Response) => {
  try {
    const domainSlug = req.query.domain as string;
    const courses = await courseService.getCourses(true, domainSlug);
    res.status(200).json({ success: true, data: courses });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * GET /api/courses/:id
 * Retrieve full hierarchy of a course with modules, subtopics, and resources
 */
coursesRouter.get('/:id', async (req, res: Response) => {
  try {
    const course = await courseService.getCourseById(req.params.id, false);
    if (!course) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Course not found.' } });
      return;
    }
    res.status(200).json({ success: true, data: course });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

// ============================================================================
// Main Admin Centralized Authoring Endpoints
// ============================================================================

/**
 * POST /api/courses
 * Create a new course draft
 */
coursesRouter.post('/', requireAuth, requireRole('MAIN_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const course = await courseService.createCourse(req.body, req.user!.id);
    res.status(201).json({ success: true, data: course });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: err.message } });
  }
});

/**
 * PATCH /api/courses/:id
 * Update course metadata or lifecycle status (DRAFT / PUBLISHED / ARCHIVED)
 */
coursesRouter.patch('/:id', requireAuth, requireRole('MAIN_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const course = await courseService.updateCourse(req.params.id, req.body, req.user!.id);
    res.status(200).json({ success: true, data: course });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'UPDATE_FAILED', message: err.message } });
  }
});

/**
 * POST /api/courses/:id/modules
 * Add module to course
 */
coursesRouter.post('/:id/modules', requireAuth, requireRole('MAIN_ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const module = await courseService.addModule(req.params.id, req.body, req.user!.id);
    res.status(201).json({ success: true, data: module });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'MODULE_FAILED', message: err.message } });
  }
});

/**
 * POST /api/courses/:id/modules/:moduleId/subtopics
 * Add subtopic to module
 */
coursesRouter.post(
  '/:id/modules/:moduleId/subtopics',
  requireAuth,
  requireRole('MAIN_ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const subtopic = await courseService.addSubtopic(req.params.id, req.params.moduleId, req.body, req.user!.id);
      res.status(201).json({ success: true, data: subtopic });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'SUBTOPIC_FAILED', message: err.message } });
    }
  }
);

/**
 * POST /api/courses/:id/modules/:moduleId/subtopics/:subtopicId/resources
 * Attach validated learning resource to subtopic
 */
coursesRouter.post(
  '/:id/modules/:moduleId/subtopics/:subtopicId/resources',
  requireAuth,
  requireRole('MAIN_ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const resource = await courseService.addResourceToSubtopic(
        req.params.id,
        req.params.moduleId,
        req.params.subtopicId,
        req.body,
        req.user!.id
      );
      res.status(201).json({ success: true, data: resource });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'RESOURCE_FAILED', message: err.message } });
    }
  }
);

// ============================================================================
// Centralized Question Bank Authoring Endpoints
// ============================================================================

/**
 * GET /api/courses/questions/bank
 * Admin-only: list questions with answer keys
 */
coursesRouter.get(
  '/questions/bank',
  requireAuth,
  requireRole('MAIN_ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const skillId = req.query.skillId as string;
      const status = req.query.status as any;
      const questions = await courseService.getQuestions(skillId, status);
      res.status(200).json({ success: true, data: questions });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }
);

/**
 * POST /api/courses/questions/bank
 * Admin-only: author new question
 */
coursesRouter.post(
  '/questions/bank',
  requireAuth,
  requireRole('MAIN_ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const question = await courseService.createQuestion(req.body, req.user!.id);
      res.status(201).json({ success: true, data: question });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'QUESTION_CREATION_FAILED', message: err.message } });
    }
  }
);

/**
 * PATCH /api/courses/questions/bank/:id
 * Admin-only: update question
 */
coursesRouter.patch(
  '/questions/bank/:id',
  requireAuth,
  requireRole('MAIN_ADMIN'),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const question = await courseService.updateQuestion(req.params.id, req.body, req.user!.id);
      res.status(200).json({ success: true, data: question });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'QUESTION_UPDATE_FAILED', message: err.message } });
    }
  }
);
