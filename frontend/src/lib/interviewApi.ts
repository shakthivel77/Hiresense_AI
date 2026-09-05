export type InterviewQuestionType =
  | 'BEHAVIORAL'
  | 'TECHNICAL_DEEP_DIVE'
  | 'SYSTEM_DESIGN'
  | 'PROBLEM_SOLVING';

export type InterviewDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type InterviewSessionStatus =
  | 'CONFIGURED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ABANDONED';

export type SessionQuestionStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'ANSWERED'
  | 'SKIPPED';

export type EvaluationPerformanceTier =
  | 'EXEMPLARY'
  | 'PROFICIENT'
  | 'DEVELOPING'
  | 'NEEDS_IMPROVEMENT';

export type StarPillarType = 'SITUATION' | 'TASK' | 'ACTION' | 'RESULT';
export type StarPillarPresence = 'STRONG' | 'ADEQUATE' | 'WEAK' | 'MISSING';

export interface InterviewRubricCriteria {
  keySignals: string[];
  antiPatterns: string[];
  idealAnswerOutline: string[];
  sampleFollowUpQuestions: string[];
}

export interface InterviewQuestion {
  id: string;
  type: InterviewQuestionType;
  skillId: string;
  domainSlug: string;
  title: string;
  prompt: string;
  difficulty: InterviewDifficulty;
  expectedTimeSeconds: number;
  rubric: InterviewRubricCriteria;
  tags: string[];
}

export interface InterviewSessionQuestion {
  questionId: string;
  orderIndex: number;
  question: InterviewQuestion;
  candidateResponseText: string | null;
  recordingDurationSeconds: number | null;
  status: SessionQuestionStatus;
  answeredAt: string | null;
}

export interface StarPillarEvaluation {
  pillar: StarPillarType;
  presence: StarPillarPresence;
  extractedSnippet: string | null;
  feedback: string;
  suggestedEnhancement: string;
}

export interface StarFeedbackReport {
  questionId: string;
  pillars: {
    situation: StarPillarEvaluation;
    task: StarPillarEvaluation;
    action: StarPillarEvaluation;
    result: StarPillarEvaluation;
  };
  starCompletenessScore: number;
  structuredReformulation: string;
  formattedAt: string;
}

export interface QuestionEvaluation {
  questionId: string;
  overallScore: number;
  performanceTier: EvaluationPerformanceTier;
  signalsDetected: string[];
  missedSignals: string[];
  antiPatternsFound: string[];
  strengths: string[];
  areasForImprovement: string[];
  starFeedback?: StarFeedbackReport;
  evaluatedAt: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  domainSlug: string;
  title: string;
  status: InterviewSessionStatus;
  currentQuestionIndex: number;
  questions: InterviewSessionQuestion[];
  totalQuestions: number;
  answeredQuestions: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SessionEvaluation {
  sessionId: string;
  overallScore: number;
  performanceTier: EvaluationPerformanceTier;
  questionEvaluations: QuestionEvaluation[];
  summaryFeedback: string;
  evaluatedAt: string;
}

export interface CreateInterviewSessionInput {
  domainSlug: string;
  title?: string;
  questionCount?: number;
  includeBehavioral?: boolean;
  difficulty?: InterviewDifficulty;
}

export interface SubmitAnswerInput {
  questionId: string;
  responseText: string;
  recordingDurationSeconds?: number;
}

/**
 * Fetch list of interview questions with optional filters
 */
export async function fetchInterviewQuestions(params?: {
  domainSlug?: string;
  type?: string;
  difficulty?: string;
  skillId?: string;
}): Promise<InterviewQuestion[]> {
  const query = new URLSearchParams();
  if (params?.domainSlug) query.set('domainSlug', params.domainSlug);
  if (params?.type) query.set('type', params.type);
  if (params?.difficulty) query.set('difficulty', params.difficulty);
  if (params?.skillId) query.set('skillId', params.skillId);

  const res = await fetch(`/api/interview/questions?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Failed to load interview questions: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data?.questions || [];
}

/**
 * Fetch a single interview question
 */
export async function fetchInterviewQuestionById(questionId: string): Promise<InterviewQuestion> {
  const res = await fetch(`/api/interview/questions/${encodeURIComponent(questionId)}`);
  if (!res.ok) {
    throw new Error(`Failed to load question '${questionId}': HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data?.question;
}

/**
 * Start a new interview session
 */
export async function createInterviewSession(
  input: CreateInterviewSessionInput,
  token?: string
): Promise<InterviewSession> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/interview/sessions', {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(`Failed to create interview session: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data?.session;
}

/**
 * Fetch user's historical interview sessions
 */
export async function fetchUserInterviewSessions(token?: string): Promise<InterviewSession[]> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/interview/sessions', { headers });
  if (!res.ok) {
    throw new Error(`Failed to load interview sessions: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data?.sessions || [];
}

/**
 * Fetch an interview session by ID
 */
export async function fetchInterviewSessionById(
  sessionId: string,
  token?: string
): Promise<InterviewSession> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/interview/sessions/${encodeURIComponent(sessionId)}`, { headers });
  if (!res.ok) {
    throw new Error(`Failed to load session '${sessionId}': HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data?.session;
}

/**
 * Submit candidate answer for a staged question
 */
export async function submitInterviewAnswer(
  sessionId: string,
  input: SubmitAnswerInput,
  token?: string
): Promise<InterviewSession> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/interview/sessions/${encodeURIComponent(sessionId)}/answer`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error(`Failed to submit answer: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data?.session;
}

/**
 * Skip a question in an active session
 */
export async function skipInterviewQuestion(
  sessionId: string,
  questionId: string,
  token?: string
): Promise<InterviewSession> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/interview/sessions/${encodeURIComponent(sessionId)}/skip`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ questionId }),
  });

  if (!res.ok) {
    throw new Error(`Failed to skip question: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data?.session;
}

/**
 * Abandon an active session
 */
export async function abandonInterviewSession(
  sessionId: string,
  token?: string
): Promise<InterviewSession> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/interview/sessions/${encodeURIComponent(sessionId)}/abandon`, {
    method: 'POST',
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to abandon session: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data?.session;
}

/**
 * Generate full AI rubric & STAR evaluation for a completed session
 */
export async function evaluateInterviewSession(
  sessionId: string,
  token?: string
): Promise<SessionEvaluation> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/interview/sessions/${encodeURIComponent(sessionId)}/evaluate`, {
    method: 'POST',
    headers,
  });

  if (!res.ok) {
    throw new Error(`Failed to evaluate interview session: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data?.evaluation;
}

/**
 * Directly evaluate a single answer on the fly
 */
export async function evaluateSingleAnswer(
  questionId: string,
  responseText: string,
  token?: string
): Promise<QuestionEvaluation> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/interview/evaluate-answer', {
    method: 'POST',
    headers,
    body: JSON.stringify({ questionId, responseText }),
  });

  if (!res.ok) {
    throw new Error(`Failed to evaluate answer: HTTP ${res.status}`);
  }
  const json = await res.json();
  return json.data?.evaluation;
}
