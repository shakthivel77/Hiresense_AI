import { randomUUID } from 'crypto';
import {
  InterviewSessionDTO,
  InterviewSessionQuestionDTO,
  CreateInterviewSessionInput,
  SubmitAnswerInput,
} from './types.js';
import { interviewQuestionBankService } from './interviewQuestionBankService.js';
import { isSupabaseConfigured, getSupabaseClient } from '../common/supabase.js';

export class InterviewSessionService {
  private sessionsMap = new Map<string, InterviewSessionDTO>();

  /**
   * Create a new staged interview session
   */
  public async createSession(
    userId: string,
    input: CreateInterviewSessionInput
  ): Promise<InterviewSessionDTO> {
    const questions = await interviewQuestionBankService.selectQuestionsForInterview({
      domainSlug: input.domainSlug,
      questionCount: input.questionCount || 4,
      includeBehavioral: input.includeBehavioral ?? true,
      difficulty: input.difficulty,
    });

    const sessionId = `int-sess-${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    const domainTitle = input.domainSlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    const stagedQuestions: InterviewSessionQuestionDTO[] = questions.map((q, idx) => ({
      questionId: q.id,
      orderIndex: idx,
      question: q,
      candidateResponseText: null,
      recordingDurationSeconds: null,
      status: idx === 0 ? 'ACTIVE' : 'PENDING',
      answeredAt: null,
    }));

    const session: InterviewSessionDTO = {
      id: sessionId,
      userId,
      domainSlug: input.domainSlug,
      title: input.title || `${domainTitle} Mock Interview`,
      status: 'IN_PROGRESS',
      currentQuestionIndex: 0,
      questions: stagedQuestions,
      totalQuestions: stagedQuestions.length,
      answeredQuestions: 0,
      startedAt: now,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    this.sessionsMap.set(session.id, session);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        await supabase.from('interview_sessions').upsert({
          id: session.id,
          user_id: session.userId,
          domain_slug: session.domainSlug,
          title: session.title,
          status: session.status,
          current_question_index: session.currentQuestionIndex,
          questions: session.questions,
          total_questions: session.totalQuestions,
          answered_questions: session.answeredQuestions,
          started_at: session.startedAt,
          completed_at: session.completedAt,
          created_at: session.createdAt,
          updated_at: session.updatedAt,
        });
      } catch (err) {
        console.warn('[InterviewSessionService] Supabase sync deferred:', err);
      }
    }

    return session;
  }

  /**
   * Retrieve an interview session by ID
   */
  public async getSessionById(sessionId: string): Promise<InterviewSessionDTO | null> {
    return this.sessionsMap.get(sessionId) || null;
  }

  /**
   * Retrieve all interview sessions for a candidate
   */
  public async getUserSessions(userId: string): Promise<InterviewSessionDTO[]> {
    return Array.from(this.sessionsMap.values())
      .filter((s) => s.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Submit candidate response for a specific staged question
   */
  public async submitQuestionAnswer(
    sessionId: string,
    input: SubmitAnswerInput
  ): Promise<InterviewSessionDTO> {
    const session = this.sessionsMap.get(sessionId);
    if (!session) {
      throw new Error(`Interview session '${sessionId}' not found`);
    }

    if (session.status === 'COMPLETED' || session.status === 'ABANDONED') {
      throw new Error(`Cannot submit answers to a ${session.status.toLowerCase()} session`);
    }

    const questionIndex = session.questions.findIndex(
      (q) => q.questionId === input.questionId
    );

    if (questionIndex === -1) {
      throw new Error(`Question '${input.questionId}' is not part of this session`);
    }

    const now = new Date().toISOString();
    const staged = session.questions[questionIndex];

    staged.candidateResponseText = input.responseText.trim();
    staged.recordingDurationSeconds = input.recordingDurationSeconds || null;
    staged.status = 'ANSWERED';
    staged.answeredAt = now;

    // Recount answered
    session.answeredQuestions = session.questions.filter(
      (q) => q.status === 'ANSWERED' || q.status === 'SKIPPED'
    ).length;

    // Advance pointer or complete session
    if (session.answeredQuestions >= session.totalQuestions) {
      session.status = 'COMPLETED';
      session.completedAt = now;
    } else {
      // Find next pending question
      const nextPendingIndex = session.questions.findIndex((q) => q.status === 'PENDING');
      if (nextPendingIndex !== -1) {
        session.currentQuestionIndex = nextPendingIndex;
        session.questions[nextPendingIndex].status = 'ACTIVE';
      }
    }

    session.updatedAt = now;
    this.sessionsMap.set(session.id, session);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        await supabase
          .from('interview_sessions')
          .update({
            status: session.status,
            current_question_index: session.currentQuestionIndex,
            questions: session.questions,
            answered_questions: session.answeredQuestions,
            completed_at: session.completedAt,
            updated_at: session.updatedAt,
          })
          .eq('id', session.id);
      } catch (err) {
        console.warn('[InterviewSessionService] Supabase sync deferred:', err);
      }
    }

    return session;
  }

  /**
   * Skip a question in the session
   */
  public async skipQuestion(sessionId: string, questionId: string): Promise<InterviewSessionDTO> {
    const session = this.sessionsMap.get(sessionId);
    if (!session) {
      throw new Error(`Interview session '${sessionId}' not found`);
    }

    const questionIndex = session.questions.findIndex((q) => q.questionId === questionId);
    if (questionIndex === -1) {
      throw new Error(`Question '${questionId}' is not part of this session`);
    }

    const now = new Date().toISOString();
    const staged = session.questions[questionIndex];
    staged.status = 'SKIPPED';
    staged.answeredAt = now;

    session.answeredQuestions = session.questions.filter(
      (q) => q.status === 'ANSWERED' || q.status === 'SKIPPED'
    ).length;

    if (session.answeredQuestions >= session.totalQuestions) {
      session.status = 'COMPLETED';
      session.completedAt = now;
    } else {
      const nextPendingIndex = session.questions.findIndex((q) => q.status === 'PENDING');
      if (nextPendingIndex !== -1) {
        session.currentQuestionIndex = nextPendingIndex;
        session.questions[nextPendingIndex].status = 'ACTIVE';
      }
    }

    session.updatedAt = now;
    this.sessionsMap.set(session.id, session);
    return session;
  }

  /**
   * Abandon an in-progress session
   */
  public async abandonSession(sessionId: string): Promise<InterviewSessionDTO> {
    const session = this.sessionsMap.get(sessionId);
    if (!session) {
      throw new Error(`Interview session '${sessionId}' not found`);
    }

    session.status = 'ABANDONED';
    session.updatedAt = new Date().toISOString();
    this.sessionsMap.set(session.id, session);
    return session;
  }
}

export const interviewSessionService = new InterviewSessionService();
