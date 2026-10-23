import { Request } from 'express';

export type CanonicalRole = 'STUDENT' | 'MONITORING_ADMIN' | 'MAIN_ADMIN';
export type AnyRole = CanonicalRole | 'student' | 'professional' | 'admin';

export function normalizeRole(role?: string): CanonicalRole {
  if (!role) return 'STUDENT';
  const upper = role.toUpperCase();
  if (upper === 'MAIN_ADMIN' || upper === 'ADMIN') return 'MAIN_ADMIN';
  if (upper === 'MONITORING_ADMIN') return 'MONITORING_ADMIN';
  return 'STUDENT';
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: CanonicalRole;
  token?: string;
  collegeId?: string | null;
  affiliationStatus?: 'UNCLAIMED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  assignedCollegeIds?: string[];
  isActive?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
