import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './types.js';
import { getSupabaseClient, isSupabaseConfigured } from '../common/supabase.js';

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Missing or malformed Authorization header. Expected Bearer token.',
        },
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    if (!isSupabaseConfigured()) {
      // Development mock bypass mode when Supabase is not configured
      if (process.env.NODE_ENV === 'development' && token === 'mock-dev-token') {
        req.user = {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'dev-user@hiresense.ai',
        };
        next();
        return;
      }
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired authentication token.',
        },
      });
      return;
    }

    req.user = {
      id: data.user.id,
      email: data.user.email || '',
    };

    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication check failed.',
      },
    });
  }
}
