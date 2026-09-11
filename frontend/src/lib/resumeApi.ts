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

export interface ResumeExtractionResult {
  success: boolean;
  rawTextLength: number;
  normalizedText: string;
  sections: ResumeSectionBreakdown;
  extractedAt: string;
  warningNotice?: string;
}

export interface ExtractedSkillClaim {
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
  confidence: number;
}

export interface ResumeSkillExtractionResponse {
  success: boolean;
  totalClaimsFound: number;
  matchedTaxonomySkills: ExtractedSkillClaim[];
  unmappedKeywords: string[];
  candidateProfileUpdate: {
    userId?: string;
    totalUnverifiedClaims: number;
    recommendedAssessmentSkillIds: string[];
  };
  invariantNotice: string;
  extractedAt: string;
}

/**
 * Extracts and segments text from candidate resume payload.
 */
export async function extractResumeText(
  payload: ResumeExtractionRequest,
  token?: string | null
): Promise<ResumeExtractionResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/resume/extract-text', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to extract resume text');
  }

  return data.data;
}

/**
 * Parse raw pasted resume text.
 */
export async function parseRawResumeText(
  text: string,
  token?: string | null
): Promise<ResumeExtractionResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/resume/parse-raw', {
    method: 'POST',
    headers,
    body: JSON.stringify({ text }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to parse raw resume text');
  }

  return data.data;
}

/**
 * Extract taxonomy skills from resume text or parsed sections.
 */
export async function extractResumeSkills(
  payload: { rawText?: string; fileBase64?: string; sections?: ResumeSectionBreakdown },
  token?: string | null
): Promise<ResumeSkillExtractionResponse> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/resume/extract-skills', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to extract resume skills');
  }

  return data.data;
}

/**
 * Persist extracted unverified skill claims into candidate profile.
 */
export async function importSkillClaims(
  userId: string,
  claims: ExtractedSkillClaim[],
  token?: string | null
): Promise<{ success: boolean; data: { importedCount: number; claims: ExtractedSkillClaim[] } }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/resume/import-claims', {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId, claims }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to import skill claims');
  }

  return data;
}

