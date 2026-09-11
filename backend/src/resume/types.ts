export interface ResumeExtractionRequest {
  rawText?: string;
  fileBase64?: string;
  mimeType?: 'application/pdf' | 'text/plain' | 'text/markdown' | string;
  fileName?: string;
}

export interface ExtractedContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

export interface ExtractedExperienceItem {
  company: string;
  role: string;
  duration?: string;
  bullets: string[];
}

export interface ExtractedEducationItem {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  year?: string;
}

export interface ExtractedProjectItem {
  title: string;
  technologies: string[];
  description: string;
}

export interface ResumeSectionBreakdown {
  contact: ExtractedContactInfo;
  summary?: string;
  experience: ExtractedExperienceItem[];
  education: ExtractedEducationItem[];
  rawSkillsText: string[];
  projects: ExtractedProjectItem[];
  certifications: string[];
}

export interface ResumeExtractionResultDTO {
  success: boolean;
  rawTextLength: number;
  normalizedText: string;
  sections: ResumeSectionBreakdown;
  extractedAt: string;
  warningNotice?: string;
}

export interface ExtractedSkillClaimDTO {
  skillId: string;
  skillName: string;
  category: string;
  domainSlug: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  status: 'UNVERIFIED';
  verificationScore: null;
  matchType: 'exact' | 'alias' | 'contextual';
  extractedFrom: 'skills_section' | 'experience' | 'projects' | 'education';
  mentionContext?: string;
  confidence: number; // 0.0 - 1.0
}

export interface ResumeSkillExtractionResponseDTO {
  success: boolean;
  totalClaimsFound: number;
  matchedTaxonomySkills: ExtractedSkillClaimDTO[];
  unmappedKeywords: string[];
  candidateProfileUpdate: {
    userId?: string;
    totalUnverifiedClaims: number;
    recommendedAssessmentSkillIds: string[];
  };
  invariantNotice: string;
  extractedAt: string;
}

export interface ImportSkillClaimsRequestDTO {
  userId: string;
  claims: ExtractedSkillClaimDTO[];
}

