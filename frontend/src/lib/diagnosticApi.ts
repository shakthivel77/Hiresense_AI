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
