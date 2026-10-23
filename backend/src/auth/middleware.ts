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

    // Development mock token handling
    if (token === 'mock-dev-token') {
      // Strictly reject mock development token in production or when Supabase is configured
      if (process.env.NODE_ENV === 'production' || isSupabaseConfigured()) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Mock development authentication token is not accepted in this environment.',
          },
        });
        return;
      }

      // Allow mock token only in non-production when Supabase is not configured
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'dev-user@hiresense.ai',
      };
      next();
      return;
    }

    // When Supabase is configured or non-mock token is provided, validate against Supabase Auth
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

    // Derive user identity strictly from the verified token
    req.user = {
      id: data.user.id,
      email: data.user.email || '',
      token: token,
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
