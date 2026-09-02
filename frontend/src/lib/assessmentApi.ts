export interface PublicQuestion {
  id: string;
  questionText: string;
  options: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface PublicTestAttempt {
  id: string;
  testId: string;
  skillId: string;
  startedAt: string;
  expiresAt: string;
  timeLimitMinutes: number;
  totalQuestions: number;
}

export interface StartAssessmentResponse {
  success: boolean;
  data: {
    attempt: PublicTestAttempt;
    questions: PublicQuestion[];
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface UserAnswerSubmission {
  questionId: string;
  selectedOptionIndex: number;
}

export interface QuestionEvaluationDetail {
  questionId: string;
  questionText: string;
  options: string[];
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  explanation?: string;
}

export interface TestEvaluationResult {
  attemptId: string;
  testId: string;
  skillId: string;
  score: number;
  passed: boolean;
  passingScore: number;
  totalQuestions: number;
  correctAnswersCount: number;
  completedAt: string;
  details: QuestionEvaluationDetail[];
  newlyUnlockedSkills?: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  proofId?: string;
  proofUrl?: string;
}

export interface SubmitAssessmentResponse {
  success: boolean;
  data: TestEvaluationResult;
  error?: {
    code: string;
    message: string;
  };
}

export async function startAssessment(
  skillId: string,
  token: string,
  questionCount = 5
): Promise<{ attempt: PublicTestAttempt; questions: PublicQuestion[] }> {
  const res = await fetch('/api/assessment/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ skillId, questionCount }),
  });

  const json: StartAssessmentResponse = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error?.message || `Failed to start assessment: HTTP ${res.status}`);
  }

  return json.data;
}

export async function submitAssessment(
  attemptId: string,
  answers: UserAnswerSubmission[],
  token: string
): Promise<TestEvaluationResult> {
  const res = await fetch('/api/assessment/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ attemptId, answers }),
  });

  const json: SubmitAssessmentResponse = await res.json();
  if (!res.ok || !json.success || !json.data) {
    throw new Error(json.error?.message || `Failed to submit assessment: HTTP ${res.status}`);
  }

  return json.data;
}

export interface SkillAttemptStatusDTO {
  skillId: string;
  maxMonthlyAttempts: number;
  attemptsUsedThisMonth: number;
  attemptsRemaining: number;
  canAttempt: boolean;
  nextResetDate: string;
  daysUntilReset: number;
  recentAttempts: Array<{
    id: string;
    score: number | null;
    passed: boolean | null;
    status: string;
    startedAt: string;
    completedAt: string | null;
  }>;
}

export async function fetchSkillAttemptStatus(
  skillId: string,
  token: string
): Promise<SkillAttemptStatusDTO> {
  const res = await fetch(`/api/assessment/attempts-status/${skillId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch attempt status: HTTP ${res.status}`);
  }

  const json = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error?.message || 'Failed to retrieve attempt status');
  }

  return json.data;
}
