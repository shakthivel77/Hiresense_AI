export type CollegeStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type AffiliationStatus = 'UNCLAIMED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
export type AssignmentStatus = 'ACTIVE' | 'REVOKED';

export interface CollegeDTO {
  id: string;
  name: string;
  code: string;
  domain?: string | null;
  status: CollegeStatus;
  studentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollegeInput {
  name: string;
  code: string;
  domain?: string;
}

export interface UpdateCollegeInput {
  name?: string;
  code?: string;
  domain?: string;
  status?: CollegeStatus;
}

export interface MonitoringAdminCollegeDTO {
  id: string;
  adminId: string;
  collegeId: string;
  collegeName?: string;
  collegeCode?: string;
  assignedBy: string;
  status: AssignmentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StudentAffiliationRequestDTO {
  id: string;
  studentId: string;
  studentName?: string;
  studentEmail?: string;
  collegeId?: string | null;
  collegeName?: string;
  requestedCollegeName?: string;
  officialCollegeEmail?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuditLogDTO {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface MonitoringAdminAccountDTO {
  id: string;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  assignedColleges: Array<{
    collegeId: string;
    collegeName: string;
    collegeCode: string;
    status: AssignmentStatus;
  }>;
  createdAt: string;
}

export interface PlatformOverviewStats {
  totalStudents: number;
  totalApprovedColleges: number;
  pendingCollegeRequests: number;
  monitoringAdminCount: number;
  publishedCoursesCount: number;
  assessmentAttemptsCount: number;
  averagePassRate: number;
  verifiedSkillsCount: number;
  collegeComparisons: Array<{
    collegeId: string;
    collegeName: string;
    code: string;
    studentCount: number;
    verifiedSkillsCount: number;
    averagePassRate: number;
  }>;
}

export interface CollegeAnalyticsDTO {
  college: CollegeDTO;
  verifiedStudentCount: number;
  pendingStudentCount: number;
  totalAssessments: number;
  passingRate: number;
  topVerifiedSkills: Array<{ skillId: string; count: number; name?: string }>;
  skillGaps: Array<{ skillId: string; unverifiedCount: number; failureCount: number; name?: string }>;
  topStudents: Array<{ userId: string; name: string; score: number; verifiedSkillsCount: number }>;
}
