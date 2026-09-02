export interface UserProfileDTO {
  id: string;
  email: string;
  displayName: string;
  role: 'student' | 'professional' | 'admin';
  institution?: string;
  careerGoal?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  institution?: string;
  careerGoal?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}
