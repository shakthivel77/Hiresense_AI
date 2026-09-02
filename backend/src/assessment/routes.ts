import { Router, Response } from 'express';
import { requireAuth } from '../auth/middleware.js';
import { AuthenticatedRequest } from '../auth/types.js';
import { testService } from './testService.js';
import { questionSelectionService } from './questionSelectionService.js';
import { questionBankService } from './questionBankService.js';
import { sanitizeQuestionForClient, QuestionDTO } from './types.js';

const router = Router();

/**
 * POST /api/assessment/start
 * Protected endpoint to initiate a timed assessment attempt with randomized questions
 */
router.post('/start', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const { skillId, questionCount } = req.body;
    if (!skillId || typeof skillId !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'skillId parameter is required' },
      });
      return;
    }

    const targetSkillId = skillId.trim().toLowerCase();

    // 1. Monthly Attempt Limit Enforcement (Max 3 attempts per calendar month)
    const userAttempts = await testService.getUserAttempts(userId, targetSkillId);
    const now = new Date();
    const currentMonthAttempts = userAttempts.filter((a) => {
      const d = new Date(a.startedAt);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        a.status === 'COMPLETED'
      );
    });

    if (currentMonthAttempts.length >= 3) {
      res.status(429).json({
        success: false,
        error: {
          code: 'ATTEMPT_LIMIT_EXCEEDED',
          message: 'Monthly limit reached: A skill can be attempted at most 3 times per calendar month.',
        },
      });
      return;
    }

    // 2. Select randomized questions
    const count = typeof questionCount === 'number' && questionCount > 0 ? Math.min(questionCount, 10) : 5;
    const selectedQuestions = await questionSelectionService.selectQuestionsForTest(targetSkillId, count);
    const questionIds = selectedQuestions.map((q) => q.id);

    // 3. Create timed attempt
    const attempt = await testService.createAttempt(userId, targetSkillId, questionIds);

    // 4. Sanitize questions (strip answer keys and explanations)
    const publicQuestions = selectedQuestions.map(sanitizeQuestionForClient);

    res.status(201).json({
      success: true,
      data: {
        attempt: {
          id: attempt.id,
          testId: attempt.testId,
          skillId: attempt.skillId,
          startedAt: attempt.startedAt,
          expiresAt: attempt.expiresAt,
          timeLimitMinutes: 15,
          totalQuestions: publicQuestions.length,
        },
        questions: publicQuestions,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message || 'Failed to start assessment attempt',
      },
    });
  }
});

/**
 * GET /api/assessment/attempt/:attemptId
 * Protected endpoint to get active attempt state and sanitized questions
 */
router.get('/attempt/:attemptId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const { attemptId } = req.params;
    const attempt = await testService.getAttemptById(attemptId);
    if (!attempt) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Test attempt '${attemptId}' not found` },
      });
      return;
    }

    if (attempt.userId !== userId) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have access to this attempt' },
      });
      return;
    }

    // Retrieve questions and sanitize
    const questions: QuestionDTO[] = [];
    for (const qId of attempt.questionIds) {
      const q = await questionBankService.getQuestionById(qId);
      if (q) questions.push(q);
    }

    const publicQuestions = questions.map(sanitizeQuestionForClient);

    res.status(200).json({
      success: true,
      data: {
        attempt: {
          id: attempt.id,
          testId: attempt.testId,
          skillId: attempt.skillId,
          status: attempt.status,
          score: attempt.score,
          passed: attempt.passed,
          startedAt: attempt.startedAt,
          expiresAt: attempt.expiresAt,
          completedAt: attempt.completedAt,
        },
        questions: publicQuestions,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to retrieve attempt' },
    });
  }
});

/**
 * POST /api/assessment/submit
 * Protected endpoint to submit answers and receive authoritative score & evaluation
 */
router.post('/submit', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const { attemptId, answers } = req.body;
    if (!attemptId || !Array.isArray(answers)) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'attemptId and answers array are required' },
      });
      return;
    }

    const evaluationResult = await testService.submitAttempt(attemptId, userId, answers);

    res.status(200).json({
      success: true,
      data: evaluationResult,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: { code: 'SUBMISSION_ERROR', message: error.message || 'Failed to submit test attempt' },
    });
  }
});

/**
 * GET /api/assessment/history
 * Protected endpoint to retrieve test attempt history for the user
 */
router.get('/history', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const skillId = req.query.skillId ? (req.query.skillId as string).trim().toLowerCase() : undefined;
    const attempts = await testService.getUserAttempts(userId, skillId);

    res.status(200).json({
      success: true,
      data: { attempts },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to retrieve attempt history' },
    });
  }
});

/**
 * GET /api/assessment/attempts-status/:skillId
 * Protected endpoint returning monthly attempt usage and reset schedule
 */
router.get('/attempts-status/:skillId', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const { skillId } = req.params;
    const targetSkillId = skillId ? skillId.trim().toLowerCase() : '';

    const allAttempts = await testService.getUserAttempts(userId, targetSkillId);
    const now = new Date();

    const monthlyAttempts = allAttempts.filter((a) => {
      const d = new Date(a.startedAt);
      return (
        d.getUTCFullYear() === now.getUTCFullYear() &&
        d.getUTCMonth() === now.getUTCMonth() &&
        a.status === 'COMPLETED'
      );
    });

    const attemptsUsedThisMonth = monthlyAttempts.length;
    const attemptsRemaining = Math.max(0, 3 - attemptsUsedThisMonth);
    const canAttempt = attemptsRemaining > 0;

    const nextResetDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0)
    );
    const daysUntilReset = Math.max(
      1,
      Math.ceil((nextResetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    const recentAttempts = allAttempts
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .slice(0, 5)
      .map((a) => ({
        id: a.id,
        score: a.score,
        passed: a.passed,
        status: a.status,
        startedAt: a.startedAt,
        completedAt: a.completedAt,
      }));

    res.status(200).json({
      success: true,
      data: {
        skillId: targetSkillId,
        maxMonthlyAttempts: 3,
        attemptsUsedThisMonth,
        attemptsRemaining,
        canAttempt,
        nextResetDate: nextResetDate.toISOString(),
        daysUntilReset,
        recentAttempts,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to retrieve attempt status' },
    });
  }
});

export default router;
export { router as assessmentRouter };
