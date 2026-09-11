import { QuestionDifficulty } from './types.js';

export interface DomainDiagnosticRequestDTO {
  domainSlug: string;
  userId?: string;
  targetSkillIds?: string[];
}

export interface DiagnosticQuestionItemDTO {
  id: string;
  skillId: string;
  skillName: string;
  category: string;
  questionText: string;
  options: string[];
  difficulty: QuestionDifficulty;
}

export interface PublicDomainDiagnosticDTO {
  diagnosticId: string;
  domainSlug: string;
  domainName: string;
  title: string;
  totalSkillsTested: number;
  totalQuestions: number;
  timeLimitMinutes: number;
  expiresAt: string;
  questions: DiagnosticQuestionItemDTO[];
}

export interface DiagnosticAnswerSubmission {
  questionId: string;
  selectedOptionIndex: number;
}

export interface DiagnosticSubmissionRequestDTO {
  diagnosticId: string;
  userId: string;
  answers: DiagnosticAnswerSubmission[];
}

export interface SkillDiagnosticBreakdown {
  skillId: string;
  skillName: string;
  category: string;
  difficulty: string;
  questionsTested: number;
  correctAnswers: number;
  score: number; // 0 - 100
  verified: boolean; // score >= 80
  status: 'VERIFIED' | 'UNVERIFIED';
  proofId?: string;
  feedback?: string;
}

export interface DomainDiagnosticEvaluationDTO {
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
