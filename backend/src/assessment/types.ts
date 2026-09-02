export type QuestionDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type TestAttemptStatus = 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED';

/**
 * Authoritative internal Question entity (includes answer key and explanation)
 */
export interface QuestionDTO {
  id: string;
  questionBankId: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  difficulty: QuestionDifficulty;
  createdAt: string;
}

/**
 * Client-safe Public Question representation (strips answer keys to prevent client cheating)
 */
export interface PublicQuestionDTO {
  id: string;
  questionText: string;
  options: string[];
  difficulty: QuestionDifficulty;
}

/**
 * Question Bank grouping questions per skill
 */
export interface QuestionBankDTO {
  id: string;
  skillId: string;
  title: string;
  createdAt: string;
  totalQuestions?: number;
}

/**
 * Input structure for question creation
 */
export interface CreateQuestionDTO {
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  difficulty?: QuestionDifficulty;
}

/**
 * Test Definition entity
 */
export interface TestDTO {
  id: string;
  skillId: string;
  title: string;
  timeLimitMinutes: number;
  passingScore: number;
  createdAt: string;
}

/**
 * User answer submission item
 */
export interface UserAnswerSubmission {
  questionId: string;
  selectedOptionIndex: number;
}

/**
 * Authoritative Test Attempt entity
 */
export interface TestAttemptDTO {
  id: string;
  testId: string;
  userId: string;
  skillId: string;
  questionIds: string[];
  answers: UserAnswerSubmission[];
  score: number | null;
  passed: boolean | null;
  status: TestAttemptStatus;
  startedAt: string;
  completedAt: string | null;
  expiresAt: string;
}

/**
 * Client-safe active Test Attempt payload
 */
export interface PublicTestAttemptDTO {
  id: string;
  testId: string;
  skillId: string;
  title: string;
  timeLimitMinutes: number;
  expiresAt: string;
  questions: PublicQuestionDTO[];
}

/**
 * Answer evaluation item for completed tests
 */
export interface QuestionEvaluationDetail {
  questionId: string;
  questionText: string;
  options: string[];
  selectedOptionIndex: number;
  correctOptionIndex: number;
  isCorrect: boolean;
  explanation?: string;
}

/**
 * Final Test Evaluation Result returned upon test submission
 */
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

/**
 * Sanitizer utility to convert QuestionDTO to PublicQuestionDTO
 */
export function sanitizeQuestionForClient(q: QuestionDTO): PublicQuestionDTO {
  return {
    id: q.id,
    questionText: q.questionText,
    options: [...q.options],
    difficulty: q.difficulty,
  };
}
