export interface DiagnosticQuestionItem {
  id: string;
  skillId: string;
  skillName: string;
  category: string;
  questionText: string;
  options: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface PublicDomainDiagnostic {
  diagnosticId: string;
  domainSlug: string;
  domainName: string;
  title: string;
  totalSkillsTested: number;
  totalQuestions: number;
  timeLimitMinutes: number;
  expiresAt: string;
  questions: DiagnosticQuestionItem[];
}

export interface DiagnosticAnswerSubmission {
  questionId: string;
  selectedOptionIndex: number;
}

export interface SkillDiagnosticBreakdown {
  skillId: string;
  skillName: string;
  category: string;
  difficulty: string;
  questionsTested: number;
  correctAnswers: number;
  score: number;
  verified: boolean;
  status: 'VERIFIED' | 'UNVERIFIED';
  proofId?: string;
  feedback?: string;
}

export interface DomainDiagnosticEvaluation {
  diagnosticId: string;
  domainSlug: string;
  userId: string;
  overallScore: number;
  completedAt: string;
  totalSkillsTested: number;
  verifiedSkillsCount: number;
  unverifiedSkillsCount: number;
  skillBreakdown: SkillDiagnosticBreakdown[];
  newlyVerifiedProofs: Array<{ skillId: string; skillName: string; proofId: string; score: number }>;
  recommendedRemediations: Array<{ skillId: string; skillName: string; reason: string }>;
  invariantNotice: string;
}

export interface DiagnosticTrackSkill {
  id: string;
  name: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questionCount: number;
}

export interface DiagnosticTrack {
  slug: string;
  name: string;
  description: string;
  totalSkills: number;
  skills: DiagnosticTrackSkill[];
}

export const DEFAULT_DIAGNOSTIC_TRACKS: DiagnosticTrack[] = [
  {
    slug: 'backend-developer',
    name: 'Backend Developer',
    description: 'Core backend systems: Node.js Architecture, PostgreSQL Indexing, and REST API Security.',
    totalSkills: 3,
    skills: [
      { id: 's1', name: 'Node.js Architecture', category: 'Backend Core', difficulty: 'intermediate', questionCount: 2 },
      { id: 's2', name: 'PostgreSQL Indexing', category: 'Databases', difficulty: 'advanced', questionCount: 2 },
      { id: 's3', name: 'REST API Security', category: 'Security', difficulty: 'advanced', questionCount: 2 },
    ],
  },
  {
    slug: 'frontend-developer',
    name: 'Frontend Developer',
    description: 'Modern client engineering: React State Management and TypeScript Strict Patterns.',
    totalSkills: 2,
    skills: [
      { id: 's10', name: 'React State Management', category: 'Frontend Core', difficulty: 'intermediate', questionCount: 2 },
      { id: 's11', name: 'TypeScript Strict Patterns', category: 'Languages', difficulty: 'intermediate', questionCount: 2 },
    ],
  },
  {
    slug: 'ai-data-engineer',
    name: 'AI & Data Engineer',
    description: 'Modern intelligent systems: PyTorch Deep Learning and Vector Embeddings for AI/RAG.',
    totalSkills: 2,
    skills: [
      { id: 's7', name: 'PyTorch Deep Learning', category: 'Machine Learning', difficulty: 'advanced', questionCount: 1 },
      { id: 's9', name: 'Vector Embeddings', category: 'AI Architecture', difficulty: 'advanced', questionCount: 1 },
    ],
  },
];

/**
 * Fetch available domain tracks with fallback to default catalog
 */
export async function fetchDiagnosticTracks(
  token?: string | null
): Promise<DiagnosticTrack[]> {
  try {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch('/api/assessment/diagnostic/tracks', { headers });
    const data = await res.json();
    if (res.ok && data.success && Array.isArray(data.data?.tracks)) {
      return data.data.tracks;
    }
  } catch {
    // Fall back to default catalog
  }
  return DEFAULT_DIAGNOSTIC_TRACKS;
}

/**
 * Generate a new multi-skill domain diagnostic assessment
 */
export async function generateDomainDiagnostic(
  payload: { domainSlug: string; userId?: string; targetSkillIds?: string[] },
  token?: string | null
): Promise<PublicDomainDiagnostic> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/assessment/diagnostic/generate', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to generate domain diagnostic');
  }

  return data.data;
}

/**
 * Fetch an active diagnostic by ID
 */
export async function fetchDiagnostic(
  diagnosticId: string,
  token?: string | null
): Promise<PublicDomainDiagnostic> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`/api/assessment/diagnostic/${diagnosticId}`, { headers });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to fetch diagnostic');
  }

  return data.data;
}

/**
 * Submit diagnostic assessment answers for multi-skill verification
 */
export async function submitDiagnosticAnswers(
  diagnosticId: string,
  userId: string,
  answers: DiagnosticAnswerSubmission[],
  token?: string | null
): Promise<DomainDiagnosticEvaluation> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/assessment/diagnostic/submit', {
    method: 'POST',
    headers,
    body: JSON.stringify({ diagnosticId, userId, answers }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error?.message || 'Failed to submit diagnostic answers');
  }

  return data.data;
}
