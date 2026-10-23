import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, CanonicalRole, normalizeRole } from './types.js';
import { getSupabaseClient, isSupabaseConfigured } from '../common/supabase.js';
import { userService } from '../users/service.js';
import { collegeService } from '../colleges/service.js';

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
    if (token.startsWith('mock-')) {
      // Allow mock token in test / dev environment when requested
      let mockRole: CanonicalRole = 'STUDENT';
      let mockUserId = '00000000-0000-0000-0000-000000000001';
      let mockEmail = 'dev-user@hiresense.ai';

      if (token === 'mock-main-admin-token') {
        mockRole = 'MAIN_ADMIN';
        mockUserId = '00000000-0000-0000-0000-000000000002';
        mockEmail = 'mainadmin@hiresense.ai';
      } else if (token.startsWith('mock-monitoring-admin-')) {
        mockRole = 'MONITORING_ADMIN';
        mockUserId = token.replace('mock-monitoring-admin-', '');
        mockEmail = `${mockUserId}@colleges.hiresense.ai`;
      }

      // Check if this dev user is suspended
      const profile = await userService.getProfileByUserId(mockUserId);
      if (profile && profile.isActive === false) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Your account has been suspended by an administrator.',
          },
        });
        return;
      }

      let assignedCollegeIds: string[] = [];
      if (mockRole === 'MONITORING_ADMIN') {
        assignedCollegeIds = await collegeService.getAdminAssignedCollegeIds(mockUserId);
      }

      req.user = {
        id: mockUserId,
        email: mockEmail,
        role: profile ? normalizeRole(profile.role) : mockRole,
        token,
        collegeId: profile?.collegeId,
        affiliationStatus: profile?.affiliationStatus,
        assignedCollegeIds,
        isActive: true,
      };
      next();
      return;
    }

    // Validate against Supabase Auth
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

    // Authoritative profile from database
    const profile = await userService.getProfileByUserId(data.user.id, token);
    const userRole = normalizeRole(profile?.role || data.user.user_metadata?.role);

    if (profile && profile.isActive === false) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Your account has been suspended by an administrator.',
        },
      });
      return;
    }

    let assignedCollegeIds: string[] = [];
    if (userRole === 'MONITORING_ADMIN') {
      assignedCollegeIds = await collegeService.getAdminAssignedCollegeIds(data.user.id);
    }

    // Derive user identity strictly from verified token + authoritative profile
    req.user = {
      id: data.user.id,
      email: data.user.email || '',
      role: userRole,
      token,
      collegeId: profile?.collegeId,
      affiliationStatus: profile?.affiliationStatus,
      assignedCollegeIds,
      isActive: profile?.isActive !== false,
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

/**
 * Enforce role-based access control.
 * Rejects requests with 403 Forbidden if user's role is not permitted.
 */
export function requireRole(allowedRoles: CanonicalRole | CanonicalRole[]) {
  const allowed = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required before role authorization check.',
        },
      });
      return;
    }

    if (!allowed.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required role: ${allowed.join(' or ')}. Current role: ${req.user.role}.`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Enforce college boundary isolation.
 * MAIN_ADMIN has access to all colleges.
 * MONITORING_ADMIN must have active assignment to the target college.
 */
export function requireCollegeAccess(options?: {
  paramName?: string;
  bodyName?: string;
  queryName?: string;
}) {
  const paramKey = options?.paramName || 'collegeId';
  const bodyKey = options?.bodyName || 'collegeId';
  const queryKey = options?.queryName || 'collegeId';

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required before college boundary check.',
        },
      });
      return;
    }

    // MAIN_ADMIN has universal college access
    if (req.user.role === 'MAIN_ADMIN') {
      next();
      return;
    }

    // Non-admins strictly blocked
    if (req.user.role !== 'MONITORING_ADMIN') {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: Only administrators can access college monitoring resources.',
        },
      });
      return;
    }

    // Extract target college ID from request
    const collegeId = (req.params[paramKey] || req.body[bodyKey] || req.query[queryKey]) as string;

    if (!collegeId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: `Missing target college identifier ('${paramKey}').`,
        },
      });
      return;
    }

    // Refresh active assigned college IDs
    const assignedIds = await collegeService.getAdminAssignedCollegeIds(req.user.id);
    req.user.assignedCollegeIds = assignedIds;

    if (!assignedIds.includes(collegeId)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied: You are not authorized to access or monitor college ${collegeId}.`,
        },
      });
      return;
    }

    next();
  };
}
