import { Router, Request, Response } from 'express';
import { interviewQuestionBankService } from './interviewQuestionBankService.js';
import { interviewSessionService } from './interviewSessionService.js';
import { interviewEvaluatorService } from './interviewEvaluatorService.js';
import { CreateInterviewSessionInput, SubmitAnswerInput } from './types.js';

const router = Router();

// Helper to resolve user ID from authorization header or demo fallback
function resolveUserId(req: Request): string {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
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
 * GET /api/interview/questions
 * List / search interview questions with query filters
 */
router.get('/questions', async (req: Request, res: Response) => {
  try {
    const { domainSlug, type, difficulty, skillId } = req.query;
    const questions = await interviewQuestionBankService.getQuestions({
      domainSlug: domainSlug as string | undefined,
      type: type as any,
      difficulty: difficulty as any,
      skillId: skillId as string | undefined,
    });

    res.status(200).json({
      success: true,
      data: { questions },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to fetch questions' },
    });
  }
});

/**
 * GET /api/interview/questions/:questionId
 * Retrieve single question details and rubrics
 */
router.get('/questions/:questionId', async (req: Request, res: Response) => {
  try {
    const { questionId } = req.params;
    const question = await interviewQuestionBankService.getQuestionById(questionId);

    if (!question) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Question '${questionId}' not found` },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { question },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to fetch question' },
    });
  }
});

/**
 * POST /api/interview/sessions
 * Start a new staged interview session
 */
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const input: CreateInterviewSessionInput = req.body;

    if (!input.domainSlug) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'domainSlug is required to start a session' },
      });
      return;
    }

    const session = await interviewSessionService.createSession(userId, input);
    res.status(201).json({
      success: true,
      data: { session },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to create session' },
    });
  }
});

/**
 * GET /api/interview/sessions
 * List all interview sessions for the authenticated candidate
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = resolveUserId(req);
    const sessions = await interviewSessionService.getUserSessions(userId);

    res.status(200).json({
      success: true,
      data: { sessions },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to fetch sessions' },
    });
  }
});

/**
 * GET /api/interview/sessions/:sessionId
 * Retrieve a specific session and its staged question state
 */
router.get('/sessions/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await interviewSessionService.getSessionById(sessionId);

    if (!session) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Interview session '${sessionId}' not found` },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { session },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to fetch session' },
    });
  }
});

/**
 * POST /api/interview/sessions/:sessionId/answer
 * Submit an answer for a staged question in an active session
 */
router.post('/sessions/:sessionId/answer', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const input: SubmitAnswerInput = req.body;

    if (!input.questionId || typeof input.responseText !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'questionId and responseText are required' },
      });
      return;
    }

    const session = await interviewSessionService.submitQuestionAnswer(sessionId, input);
    res.status(200).json({
      success: true,
      data: { session },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to submit answer' },
    });
  }
});

/**
 * POST /api/interview/sessions/:sessionId/skip
 * Skip a staged question in an active session
 */
router.post('/sessions/:sessionId/skip', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { questionId } = req.body;

    if (!questionId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'questionId is required to skip' },
      });
      return;
    }

    const session = await interviewSessionService.skipQuestion(sessionId, questionId);
    res.status(200).json({
      success: true,
      data: { session },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to skip question' },
    });
  }
});

/**
 * POST /api/interview/sessions/:sessionId/abandon
 * Cancel an in-progress session
 */
router.post('/sessions/:sessionId/abandon', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await interviewSessionService.abandonSession(sessionId);

    res.status(200).json({
      success: true,
      data: { session },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Failed to abandon session' },
    });
  }
});

/**
 * POST /api/interview/sessions/:sessionId/evaluate
 * Generate comprehensive AI rubric & STAR evaluation for a completed session
 */
router.post('/sessions/:sessionId/evaluate', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await interviewSessionService.getSessionById(sessionId);

    if (!session) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Session '${sessionId}' not found` },
      });
      return;
    }

    const evaluation = await interviewEvaluatorService.evaluateSession(session);
    res.status(200).json({
      success: true,
      data: { evaluation },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Evaluation failed' },
    });
  }
});

/**
 * POST /api/interview/evaluate-answer
 * Directly evaluate a single answer on the fly without an active session
 */
router.post('/evaluate-answer', async (req: Request, res: Response) => {
  try {
    const { questionId, responseText } = req.body;

    if (!questionId || typeof responseText !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'questionId and responseText are required' },
      });
      return;
    }

    const question = await interviewQuestionBankService.getQuestionById(questionId);
    if (!question) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Question '${questionId}' not found` },
      });
      return;
    }

    const evaluation = await interviewEvaluatorService.evaluateQuestionResponse(question, responseText);
    res.status(200).json({
      success: true,
      data: { evaluation },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_SERVER_ERROR', message: error.message || 'Answer evaluation failed' },
    });
  }
});

export default router;
export { router as interviewRouter };
