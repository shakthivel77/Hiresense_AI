import { randomUUID } from 'crypto';
import {
  TestDTO,
  TestAttemptDTO,
  TestEvaluationResult,
  UserAnswerSubmission,
  QuestionEvaluationDetail,
} from './types.js';
import { questionBankService } from './questionBankService.js';
import { skillService } from '../skills/service.js';
import { proofService } from '../portfolio/proofService.js';
import { isSupabaseConfigured, getSupabaseClient } from '../common/supabase.js';

export class TestService {
  private testsMap = new Map<string, TestDTO>(); // testId -> TestDTO
  private skillTestMap = new Map<string, string>(); // skillId -> testId
  private attemptsMap = new Map<string, TestAttemptDTO>(); // attemptId -> TestAttemptDTO

  /**
   * Get or create standard test definition for a skill
   */
  public async getOrCreateTestForSkill(skillId: string, customTitle?: string): Promise<TestDTO> {
    const existingTestId = this.skillTestMap.get(skillId);
    if (existingTestId && this.testsMap.has(existingTestId)) {
      return this.testsMap.get(existingTestId)!;
    }

    const now = new Date().toISOString();
    const test: TestDTO = {
      id: randomUUID(),
      skillId,
      title: customTitle || `${skillId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Skill Assessment`,
      timeLimitMinutes: 15,
      passingScore: 80.0,
      createdAt: now,
    };

    this.testsMap.set(test.id, test);
    this.skillTestMap.set(skillId, test.id);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        await supabase.from('tests').upsert({
          id: test.id,
          skill_id: test.skillId,
          title: test.title,
          time_limit_minutes: test.timeLimitMinutes,
          passing_score: test.passingScore,
          created_at: test.createdAt,
        });
      } catch (err) {
        console.warn('[TestService] Supabase test insert deferred:', err);
      }
    }

    return test;
  }

  /**
   * Create and start a new timed test attempt
   */
  public async createAttempt(
    userId: string,
    skillId: string,
    questionIds: string[]
  ): Promise<TestAttemptDTO> {
    const test = await this.getOrCreateTestForSkill(skillId);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + test.timeLimitMinutes * 60 * 1000);

    const attempt: TestAttemptDTO = {
      id: randomUUID(),
      testId: test.id,
      userId,
      skillId,
      questionIds,
      answers: [],
      score: null,
      passed: null,
      status: 'IN_PROGRESS',
      startedAt: now.toISOString(),
      completedAt: null,
      expiresAt: expiresAt.toISOString(),
    };

    this.attemptsMap.set(attempt.id, attempt);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        await supabase.from('test_attempts').insert({
          id: attempt.id,
          test_id: attempt.testId,
          user_id: attempt.userId,
          score: 0,
          passed: false,
          started_at: attempt.startedAt,
          completed_at: attempt.startedAt,
        });
      } catch (err) {
        console.warn('[TestService] Supabase attempt insert deferred:', err);
      }
    }

    return attempt;
  }

  /**
   * Get attempt by ID
   */
  public async getAttemptById(attemptId: string): Promise<TestAttemptDTO | null> {
    return this.attemptsMap.get(attemptId) || null;
  }

  /**
   * Get all attempts for a user (optionally filtered by skillId)
   */
  public async getUserAttempts(userId: string, skillId?: string): Promise<TestAttemptDTO[]> {
    const userAttempts = Array.from(this.attemptsMap.values()).filter((a) => a.userId === userId);
    if (skillId) {
      return userAttempts.filter((a) => a.skillId === skillId);
    }
    return userAttempts;
  }

  /**
   * Evaluate and record test submission against authoritative question bank
   * Invariant: Passing score (>= 80%) verifies skill and unlocks dependent competencies
   */
  public async submitAttempt(
    attemptId: string,
    userId: string,
    answers: UserAnswerSubmission[]
  ): Promise<TestEvaluationResult> {
    const attempt = this.attemptsMap.get(attemptId);
    if (!attempt) {
      throw new Error(`Test attempt '${attemptId}' not found`);
    }

    if (attempt.userId !== userId) {
      throw new Error('Unauthorized: You do not own this test attempt');
    }

    if (attempt.status === 'COMPLETED') {
      throw new Error('This test attempt has already been submitted');
    }

    // Check expiration with a 60-second network latency buffer
    const now = new Date();
    const expiryTime = new Date(attempt.expiresAt).getTime() + 60000;
    if (now.getTime() > expiryTime) {
      attempt.status = 'EXPIRED';
      throw new Error('Test time limit exceeded. Attempt has expired.');
    }

    const test = this.testsMap.get(attempt.testId) || {
      id: attempt.testId,
      skillId: attempt.skillId,
      title: 'Skill Assessment',
      timeLimitMinutes: 15,
      passingScore: 80.0,
      createdAt: attempt.startedAt,
    };

    // Evaluate answers against authoritative questions
    let correctCount = 0;
    const details: QuestionEvaluationDetail[] = [];

    for (const qId of attempt.questionIds) {
      const question = await questionBankService.getQuestionById(qId);
      const userAns = answers.find((a) => a.questionId === qId);
      const selectedIndex = userAns !== undefined ? userAns.selectedOptionIndex : -1;

      if (question) {
        const isCorrect = selectedIndex === question.correctOptionIndex;
        if (isCorrect) correctCount++;

        details.push({
          questionId: question.id,
          questionText: question.questionText,
          options: [...question.options],
          selectedOptionIndex: selectedIndex,
          correctOptionIndex: question.correctOptionIndex,
          isCorrect,
          explanation: question.explanation,
        });
      }
    }

    const totalQuestions = attempt.questionIds.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100 * 100) / 100 : 0;
    const passed = score >= test.passingScore;

    // Update attempt record
    const completedAt = now.toISOString();
    attempt.answers = answers;
    attempt.score = score;
    attempt.passed = passed;
    attempt.status = 'COMPLETED';
    attempt.completedAt = completedAt;
    this.attemptsMap.set(attempt.id, attempt);

    // Synchronize deterministic verification result with Skill Engine
    await skillService.recordVerificationResult(userId, attempt.skillId, score);

    // Calculate newly unlocked downstream competencies & generate cryptographic proof
    let newlyUnlockedSkills: Array<{ id: string; name: string; category: string }> = [];
    let proofId: string | undefined;
    let proofUrl: string | undefined;

    if (passed) {
      newlyUnlockedSkills = await skillService.getNewlyUnlockedSkills(userId, attempt.skillId);
      try {
        const proof = await proofService.createProofArtifact({
          userId,
          skillId: attempt.skillId,
          score,
          attemptId: attempt.id,
          verificationDate: completedAt,
        });
        proofId = proof.proofId;
        proofUrl = proof.proofUrl;
      } catch (err) {
        console.warn('[TestService] Proof generation deferred:', err);
      }
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        await supabase
          .from('test_attempts')
          .update({
            score: attempt.score,
            passed: attempt.passed,
            completed_at: attempt.completedAt,
          })
          .eq('id', attempt.id);
      } catch (err) {
        console.warn('[TestService] Supabase attempt update deferred:', err);
      }
    }

    return {
      attemptId: attempt.id,
      testId: test.id,
      skillId: attempt.skillId,
      score,
      passed,
      passingScore: test.passingScore,
      totalQuestions,
      correctAnswersCount: correctCount,
      completedAt,
      details,
      newlyUnlockedSkills,
      proofId,
      proofUrl,
    };
  }
}

export const testService = new TestService();
