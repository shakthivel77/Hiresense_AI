export interface UserProfileDTO {
  id: string;
  email: string;
  displayName: string;
  role: 'STUDENT' | 'MONITORING_ADMIN' | 'MAIN_ADMIN' | 'student' | 'professional' | 'admin';
  institution?: string;
  collegeId?: string | null;
  affiliationStatus?: 'UNCLAIMED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  requestedCollegeName?: string;
  officialCollegeEmail?: string;
  careerGoal?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  institution?: string;
  collegeId?: string | null;
  requestedCollegeName?: string;
  officialCollegeEmail?: string;
  careerGoal?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}
