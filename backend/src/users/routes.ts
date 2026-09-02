import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../auth/index.js';
import { UpdateProfileInput } from './types.js';
import { userService } from './service.js';

const router = Router();

// GET /api/users/profile - Protected endpoint to get current authenticated user profile
router.get('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
    return;
  }

  const profile = userService.getOrCreateProfile(req.user.id, req.user.email);
  res.status(200).json({
    success: true,
    data: { profile },
  });
});

// PUT /api/users/profile - Protected endpoint to update user profile
router.put('/profile', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
    return;
  }

  const updates: UpdateProfileInput = req.body;
  const updatedProfile = await userService.updateProfile(req.user.id, req.user.email, updates);

  res.status(200).json({
    success: true,
    data: { profile: updatedProfile },
  });
});

export default router;
export { router as usersRouter };
