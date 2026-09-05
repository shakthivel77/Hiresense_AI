import {
  InterviewQuestionDTO,
  InterviewSessionDTO,
  QuestionEvaluationDTO,
  SessionEvaluationDTO,
  EvaluationPerformanceTier,
} from './types.js';
import { starFeedbackFormatterService } from './starFeedbackFormatterService.js';

export class InterviewEvaluatorService {
  /**
   * Evaluate a candidate's response against a question's structured rubric
   */
  public async evaluateQuestionResponse(
    question: InterviewQuestionDTO,
    responseText: string
  ): Promise<QuestionEvaluationDTO> {
    const text = (responseText || '').trim();
    const textLower = text.toLowerCase();

    // 1. Handling empty or minimal response
    if (text.length < 20) {
      return {
        questionId: question.id,
        overallScore: 0,
        performanceTier: 'NEEDS_IMPROVEMENT',
        signalsDetected: [],
        missedSignals: question.rubric.keySignals,
        antiPatternsFound: [],
        strengths: ['Question acknowledged.'],
        areasForImprovement: [
          'Provide a substantive, structured answer addressing technical mechanisms and trade-offs.',
          `Consider structuring your answer around: ${question.rubric.idealAnswerOutline[0] || 'core principles'}`,
        ],
        evaluatedAt: new Date().toISOString(),
      };
    }

    // 2. Evaluate Key Signals
    const signalsDetected: string[] = [];
    const missedSignals: string[] = [];

    for (const signal of question.rubric.keySignals) {
      if (this.isSignalPresent(signal, textLower)) {
        signalsDetected.push(signal);
      } else {
        missedSignals.push(signal);
      }
    }

    // 3. Evaluate Anti-patterns
    const antiPatternsFound: string[] = [];
    for (const anti of question.rubric.antiPatterns) {
      if (this.isAntiPatternPresent(anti, textLower)) {
        antiPatternsFound.push(anti);
      }
    }

    // 4. Calculate Score
    const totalSignals = question.rubric.keySignals.length || 1;
    const signalCoverageRatio = signalsDetected.length / totalSignals;

    // Base score from rubric signal coverage (up to 70 pts)
    let score = Math.round(signalCoverageRatio * 70);

    // Depth and vocabulary bonus (up to 30 pts)
    const wordCount = text.split(/\s+/).length;
    if (wordCount >= 100) {
      score += 30;
    } else if (wordCount >= 60) {
      score += 20;
    } else if (wordCount >= 30) {
      score += 10;
    }

    // Anti-pattern penalties (-15 pts each)
    score -= antiPatternsFound.length * 15;

    // Clamp score
    score = Math.max(0, Math.min(100, score));

    // 5. Determine Performance Tier
    let performanceTier: EvaluationPerformanceTier = 'DEVELOPING';
    if (score >= 85) {
      performanceTier = 'EXEMPLARY';
    } else if (score >= 70) {
      performanceTier = 'PROFICIENT';
    } else if (score >= 50) {
      performanceTier = 'DEVELOPING';
    } else {
      performanceTier = 'NEEDS_IMPROVEMENT';
    }

    // 6. Formulate Strengths
    const strengths: string[] = [];
    if (signalsDetected.length > 0) {
      strengths.push(
        `Effectively demonstrated ${signalsDetected.length} key concept${
          signalsDetected.length > 1 ? 's' : ''
        }: ${signalsDetected[0]}`
      );
    }
    if (wordCount >= 60) {
      strengths.push('Articulated response with good depth and explanation of mechanics.');
    }
    if (antiPatternsFound.length === 0) {
      strengths.push('Avoided common technical fallacies and maintained sound engineering reasoning.');
    }
    if (strengths.length === 0) {
      strengths.push('Addressed the core subject domain with initial baseline awareness.');
    }

    // 7. Formulate Areas for Improvement
    const areasForImprovement: string[] = [];
    if (missedSignals.length > 0) {
      areasForImprovement.push(
        `Deepen technical coverage by addressing: "${missedSignals[0]}"`
      );
      if (missedSignals.length > 1) {
        areasForImprovement.push(`Also consider highlighting: "${missedSignals[1]}"`);
      }
    }
    if (antiPatternsFound.length > 0) {
      areasForImprovement.push(
        `Watch out for common pitfall: "${antiPatternsFound[0]}"`
      );
    }
    if (wordCount < 50) {
      areasForImprovement.push(
        'Elaborate more fully on architecture trade-offs, edge cases, and real-world failure modes.'
      );
    }
    if (question.rubric.idealAnswerOutline.length > 0 && areasForImprovement.length < 3) {
      areasForImprovement.push(
        `Recommended structural framework: ${question.rubric.idealAnswerOutline[0]}`
      );
    }

    let starFeedback = undefined;
    if (question.type === 'BEHAVIORAL') {
      starFeedback = starFeedbackFormatterService.formatStarFeedback(question, text);
    }

    return {
      questionId: question.id,
      overallScore: score,
      performanceTier,
      signalsDetected,
      missedSignals,
      antiPatternsFound,
      strengths,
      areasForImprovement,
      starFeedback,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Comprehensive evaluation of all answered questions in an interview session
   */
  public async evaluateSession(session: InterviewSessionDTO): Promise<SessionEvaluationDTO> {
    const questionEvaluations: QuestionEvaluationDTO[] = [];

    for (const staged of session.questions) {
      const evaluation = await this.evaluateQuestionResponse(
        staged.question,
        staged.candidateResponseText || ''
      );
      questionEvaluations.push(evaluation);
    }

    const totalEvaluated = questionEvaluations.length;
    const totalScoreSum = questionEvaluations.reduce((sum, e) => sum + e.overallScore, 0);
    const overallScore = totalEvaluated > 0 ? Math.round(totalScoreSum / totalEvaluated) : 0;

    let performanceTier: EvaluationPerformanceTier = 'DEVELOPING';
    if (overallScore >= 85) {
      performanceTier = 'EXEMPLARY';
    } else if (overallScore >= 70) {
      performanceTier = 'PROFICIENT';
    } else if (overallScore >= 50) {
      performanceTier = 'DEVELOPING';
    } else {
      performanceTier = 'NEEDS_IMPROVEMENT';
    }

    let summaryFeedback = '';
    if (overallScore >= 85) {
      summaryFeedback =
        'Outstanding mock interview performance! You demonstrated deep technical fluency, structured communication, and strong command of architectural trade-offs.';
    } else if (overallScore >= 70) {
      summaryFeedback =
        'Solid interview readiness! You clearly understand the core concepts. Focus on refining edge-case handling and articulating system failure modes to reach top-tier mastery.';
    } else if (overallScore >= 50) {
      summaryFeedback =
        'Good foundation established. To improve your interview score, provide more concrete examples, structure answers with clear problem-action-result frameworks, and review missing rubric criteria.';
    } else {
      summaryFeedback =
        'Additional preparation recommended. Review the foundational learning modules on your roadmap, review the ideal answer outlines, and practice verbalizing step-by-step technical reasoning.';
    }

    return {
      sessionId: session.id,
      overallScore,
      performanceTier,
      questionEvaluations,
      summaryFeedback,
      evaluatedAt: new Date().toISOString(),
    };
  }

  /**
   * Helper to check presence of key signal concepts using keyword stem matching
   */
  private isSignalPresent(signalDescription: string, candidateText: string): boolean {
    const stopWords = new Set([
      'the', 'and', 'for', 'with', 'that', 'this', 'from', 'using', 'explains', 'mentions',
      'describes', 'identifies', 'considers', 'clear', 'such', 'into', 'over', 'more',
    ]);

    const keywords = signalDescription
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length >= 4 && !stopWords.has(w));

    if (keywords.length === 0) return true;

    let matchCount = 0;
    for (const kw of keywords) {
      if (candidateText.includes(kw)) {
        matchCount++;
      }
    }

    // Require matching at least 35% of signal keywords or at least 2 distinct keywords
    return matchCount >= Math.max(1, Math.ceil(keywords.length * 0.35));
  }

  /**
   * Helper to detect anti-patterns
   */
  private isAntiPatternPresent(antiPatternDescription: string, candidateText: string): boolean {
    const keywords = antiPatternDescription
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length >= 5);

    if (keywords.length < 3) return false;

    let matchCount = 0;
    for (const kw of keywords) {
      if (candidateText.includes(kw)) {
        matchCount++;
      }
    }

    // Higher bar to trigger an anti-pattern penalty (at least 60% of anti-pattern terms)
    return matchCount >= Math.ceil(keywords.length * 0.6);
  }
}

export const interviewEvaluatorService = new InterviewEvaluatorService();
