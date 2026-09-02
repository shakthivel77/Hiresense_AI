import { Router, Response } from 'express';
import { requireAuth } from './middleware.js';
import { AuthenticatedRequest } from './types.js';

const router = Router();

// GET /api/auth/me - Protected endpoint returning current authenticated user
router.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
});

export default router;
