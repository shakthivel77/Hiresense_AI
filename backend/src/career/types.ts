export type SkillRequirementImportance = 'REQUIRED' | 'PREFERRED';

export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead';

export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship';

export type SkillMatchStatus = 'VERIFIED' | 'CLAIMED' | 'MISSING';

export type ReadinessTier = 'HIGH' | 'MODERATE' | 'LOW' | 'DEVELOPING';

export type GapPriority = 'IMMEDIATE_QUICK_WIN' | 'HIGH_PRIORITY' | 'MEDIUM_PRIORITY' | 'LOW_PRIORITY';

/**
 * Structured skill requirement within a job posting
 */
export interface JobSkillRequirementDTO {
  id: string;
  skillId: string; // Canonical roadmap skill ID/slug
  skillName: string;
  category: string;
  importance: SkillRequirementImportance;
  weight: number; // 1.0 for REQUIRED, 0.5 for PREFERRED
  minProficiency?: number; // e.g. 80
}

/**
 * Structured Job Posting entity
 */
export interface JobPostingDTO {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  domainSlug: string;
  rawDescription: string;
  requiredSkills: JobSkillRequirementDTO[];
  preferredSkills: JobSkillRequirementDTO[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Input to create or parse a new Job Posting
 */
export interface CreateJobPostingInput {
  title: string;
  company: string;
  location?: string;
  employmentType?: EmploymentType;
  experienceLevel?: ExperienceLevel;
  domainSlug?: string;
  rawDescription: string;
}

/**
 * Output from skill extraction
 */
export interface ExtractedSkillsResult {
  requiredSkills: JobSkillRequirementDTO[];
  preferredSkills: JobSkillRequirementDTO[];
  detectedDomainSlug: string;
}

/**
 * Itemized match assessment for a single requirement
 */
export interface MatchedSkillItem {
  requirementId: string;
  skillId: string;
  skillName: string;
  category: string;
  importance: SkillRequirementImportance;
  weight: number;
  status: SkillMatchStatus;
  isVerified: boolean;
  verificationScore: number | null;
  proofId: string | null;
  earnedWeight: number;
}

/**
 * Comprehensive deterministic job match analysis
 */
export interface JobMatchAnalysisDTO {
  jobId?: string;
  jobTitle: string;
  company: string;
  domainSlug: string;
  matchScore: number; // Overall weighted percentage (0-100)
  requiredMatchScore: number; // Required skills match percentage (0-100)
  preferredMatchScore: number; // Preferred skills match percentage (0-100)
  requiredSkillsTotal: number;
  requiredSkillsMet: number;
  preferredSkillsTotal: number;
  preferredSkillsMet: number;
  readinessTier: ReadinessTier;
  matchedSkills: MatchedSkillItem[];
  missingSkills: MatchedSkillItem[];
  analyzedAt: string;
}

/**
 * Single step in a prerequisite dependency path
 */
export interface PrerequisiteStepDTO {
  skillId: string;
  skillName: string;
  category: string;
  isVerified: boolean;
  status: 'VERIFIED' | 'AVAILABLE' | 'LOCKED';
}

/**
 * Actionable gap recommendation for a missing competency
 */
export interface SkillGapRecommendationDTO {
  skillId: string;
  skillName: string;
  category: string;
  importance: SkillRequirementImportance;
  weight: number;
  scorePotentialGain: number; // Percentage points gained when passed (e.g. +14%)
  priority: GapPriority;
  isReadyToAssess: boolean; // True if 100% of direct prerequisites are already verified
  missingPrerequisiteCount: number;
  prerequisiteChain: PrerequisiteStepDTO[];
  domainSlug: string;
  roadmapUrl: string;
  actionTip: string;
}

/**
 * Complete Career Gap Analysis Report
 */
export interface CareerGapAnalysisDTO {
  jobMatch: JobMatchAnalysisDTO;
  totalGapsCount: number;
  quickWinsCount: number;
  blockedGapsCount: number;
  recommendations: SkillGapRecommendationDTO[];
  generatedAt: string;
}
