export type SkillRequirementImportance = 'REQUIRED' | 'PREFERRED';
export type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead';
export type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship';
export type SkillMatchStatus = 'VERIFIED' | 'CLAIMED' | 'MISSING';
export type ReadinessTier = 'HIGH' | 'MODERATE' | 'LOW' | 'DEVELOPING';
export type GapPriority = 'IMMEDIATE_QUICK_WIN' | 'HIGH_PRIORITY' | 'MEDIUM_PRIORITY' | 'LOW_PRIORITY';

export interface JobSkillRequirement {
  id: string;
  skillId: string;
  skillName: string;
  category: string;
  importance: SkillRequirementImportance;
  weight: number;
  minProficiency?: number;
}

export interface JobPosting {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  domainSlug: string;
  rawDescription: string;
  requiredSkills: JobSkillRequirement[];
  preferredSkills: JobSkillRequirement[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobPostingInput {
  title: string;
  company: string;
  location?: string;
  employmentType?: EmploymentType;
  experienceLevel?: ExperienceLevel;
  domainSlug?: string;
  rawDescription: string;
}

export interface ExtractedSkillsResult {
  requiredSkills: JobSkillRequirement[];
  preferredSkills: JobSkillRequirement[];
  detectedDomainSlug: string;
}

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

export interface JobMatchAnalysis {
  jobId?: string;
  jobTitle: string;
  company: string;
  domainSlug: string;
  matchScore: number;
  requiredMatchScore: number;
  preferredMatchScore: number;
  requiredSkillsTotal: number;
  requiredSkillsMet: number;
  preferredSkillsTotal: number;
  preferredSkillsMet: number;
  readinessTier: ReadinessTier;
  matchedSkills: MatchedSkillItem[];
  missingSkills: MatchedSkillItem[];
  analyzedAt: string;
}

export interface PrerequisiteStep {
  skillId: string;
  skillName: string;
  category: string;
  isVerified: boolean;
  status: 'VERIFIED' | 'AVAILABLE' | 'LOCKED';
}

export interface SkillGapRecommendation {
  skillId: string;
  skillName: string;
  category: string;
  importance: SkillRequirementImportance;
  weight: number;
  scorePotentialGain: number;
  priority: GapPriority;
  isReadyToAssess: boolean;
  missingPrerequisiteCount: number;
  prerequisiteChain: PrerequisiteStep[];
  domainSlug: string;
  roadmapUrl: string;
  actionTip: string;
}

export interface CareerGapAnalysis {
  jobMatch: JobMatchAnalysis;
  totalGapsCount: number;
  quickWinsCount: number;
  blockedGapsCount: number;
  recommendations: SkillGapRecommendation[];
  generatedAt: string;
}

/**
 * Fetch all available job postings (benchmark & custom)
 */
export async function fetchJobPostings(): Promise<JobPosting[]> {
  const res = await fetch('/api/career/jobs');
  if (!res.ok) {
    throw new Error(`Failed to load jobs: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data?.jobs || [];
}

/**
 * Fetch a single job posting by ID
 */
export async function fetchJobPostingById(jobId: string): Promise<JobPosting> {
  const res = await fetch(`/api/career/jobs/${encodeURIComponent(jobId)}`);
  if (!res.ok) {
    throw new Error(`Failed to load job '${jobId}': HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data?.job;
}

/**
 * Ingest and persist a new custom job posting
 */
export async function createJobPosting(input: CreateJobPostingInput): Promise<JobPosting> {
  const res = await fetch('/api/career/jobs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(`Failed to create job posting: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data?.job;
}

/**
 * Parse raw job description text on the fly
 */
export async function parseJobText(
  rawDescription: string,
  domainSlug?: string
): Promise<ExtractedSkillsResult> {
  const res = await fetch('/api/career/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rawDescription, domainSlug }),
  });

  if (!res.ok) {
    throw new Error(`Failed to parse job description: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

/**
 * Perform match & gap analysis against a stored job posting
 */
export async function analyzeJobMatch(
  jobId: string,
  token?: string
): Promise<CareerGapAnalysis> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api/career/match/${encodeURIComponent(jobId)}`, {
    method: 'POST',
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to analyze job match: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}

/**
 * Perform match & gap analysis against raw job description text
 */
export async function analyzeJobMatchText(
  rawDescription: string,
  domainSlug?: string,
  token?: string
): Promise<CareerGapAnalysis> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/career/match-text', {
    method: 'POST',
    headers,
    body: JSON.stringify({ rawDescription, domainSlug }),
  });

  if (!res.ok) {
    throw new Error(`Failed to analyze job match text: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data;
}
