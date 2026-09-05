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

/**
 * Structured Evaluation Rubric for objective AI & rubric scoring
 */
export interface InterviewRubricCriteria {
  keySignals: string[]; // Competencies & concepts expected in a strong response
  antiPatterns: string[]; // Red flags, common misconceptions, or hand-waving
  idealAnswerOutline: string[]; // Key technical topics / STAR outline points
  sampleFollowUpQuestions: string[]; // Follow-ups an interviewer might ask
}

/**
 * Interview Question definition
 */
export interface InterviewQuestionDTO {
  id: string;
  type: InterviewQuestionType;
  skillId: string; // Canonical roadmap skill ID or 'general-behavioral'
  domainSlug: string; // 'backend-developer' | 'frontend-developer' | 'ai-data-engineer' | 'general'
  title: string;
  prompt: string;
  difficulty: InterviewDifficulty;
  expectedTimeSeconds: number; // e.g. 120 - 180s
  rubric: InterviewRubricCriteria;
  tags: string[];
}

/**
 * Single question staged inside an active interview session
 */
export interface InterviewSessionQuestionDTO {
  questionId: string;
  orderIndex: number;
  question: InterviewQuestionDTO;
  candidateResponseText: string | null;
  recordingDurationSeconds: number | null;
  status: SessionQuestionStatus;
  answeredAt: string | null;
}

/**
 * Single pillar breakdown in STAR analysis
 */
export interface StarPillarEvaluationDTO {
  pillar: StarPillarType;
  presence: StarPillarPresence;
  extractedSnippet: string | null;
  feedback: string;
  suggestedEnhancement: string;
}

/**
 * Complete STAR methodology feedback report
 */
export interface StarFeedbackReportDTO {
  questionId: string;
  pillars: {
    situation: StarPillarEvaluationDTO;
    task: StarPillarEvaluationDTO;
    action: StarPillarEvaluationDTO;
    result: StarPillarEvaluationDTO;
  };
  starCompletenessScore: number; // 0 - 100
  structuredReformulation: string;
  formattedAt: string;
}

/**
 * Full Interview Session representation
 */
export interface InterviewSessionDTO {
  id: string;
  userId: string;
  domainSlug: string;
  title: string;
  status: InterviewSessionStatus;
  currentQuestionIndex: number;
  questions: InterviewSessionQuestionDTO[];
  totalQuestions: number;
  answeredQuestions: number;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Evaluation for a single interview question answer
 */
export interface QuestionEvaluationDTO {
  questionId: string;
  overallScore: number; // 0 - 100
  performanceTier: EvaluationPerformanceTier;
  signalsDetected: string[];
  missedSignals: string[];
  antiPatternsFound: string[];
  strengths: string[];
  areasForImprovement: string[];
  starFeedback?: StarFeedbackReportDTO;
  evaluatedAt: string;
}

/**
 * Comprehensive Evaluation for an entire completed interview session
 */
export interface SessionEvaluationDTO {
  sessionId: string;
  overallScore: number; // 0 - 100
  performanceTier: EvaluationPerformanceTier;
  questionEvaluations: QuestionEvaluationDTO[];
  summaryFeedback: string;
  evaluatedAt: string;
}

/**
 * Filter parameters for question selection
 */
export interface InterviewQuestionQuery {
  domainSlug?: string;
  type?: InterviewQuestionType;
  difficulty?: InterviewDifficulty;
  skillId?: string;
}

/**
 * Input for assembling an interview session question set
 */
export interface SelectInterviewQuestionsParams {
  domainSlug: string;
  questionCount?: number; // default: 4 (e.g. 1 behavioral + 3 technical)
  includeBehavioral?: boolean; // default: true
  difficulty?: InterviewDifficulty;
}

/**
 * Input to start / create an interview session
 */
export interface CreateInterviewSessionInput {
  domainSlug: string;
  title?: string;
  questionCount?: number;
  includeBehavioral?: boolean;
  difficulty?: InterviewDifficulty;
}

/**
 * Input for submitting a question answer
 */
export interface SubmitAnswerInput {
  questionId: string;
  responseText: string;
  recordingDurationSeconds?: number;
}
