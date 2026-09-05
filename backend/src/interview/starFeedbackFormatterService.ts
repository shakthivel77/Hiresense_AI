import {
  InterviewQuestionDTO,
  StarFeedbackReportDTO,
  StarPillarEvaluationDTO,
  StarPillarPresence,
} from './types.js';

export class StarFeedbackFormatterService {
  /**
   * Format and evaluate candidate response using the STAR methodology
   */
  public formatStarFeedback(
    question: InterviewQuestionDTO,
    responseText: string
  ): StarFeedbackReportDTO {
    const text = (responseText || '').trim();
    const textLower = text.toLowerCase();
    const sentences = text
      .split(/(?<=[.?!])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    // 1. Situation Analysis
    const situationCues = [
      'when i was', 'at my previous', 'working on', 'our team', 'the system',
      'in my role', 'project', 'client', 'company', 'environment', 'legacy',
      'architecture', 'codebase', 'incident', 'we were building', 'production',
    ];
    const situationSnippet = this.findMatchingSentence(sentences, situationCues);
    const situationPresence = this.assessPresence(situationSnippet, 15);

    const situation: StarPillarEvaluationDTO = {
      pillar: 'SITUATION',
      presence: situationPresence,
      extractedSnippet: situationSnippet,
      feedback:
        situationPresence === 'STRONG' || situationPresence === 'ADEQUATE'
          ? 'Clear background context established regarding the project environment, systems, or team setting.'
          : 'Background context is vague or omitted. Clarify the company, project stakes, or architecture context early.',
      suggestedEnhancement:
        'Set the scene in 1-2 sentences: specify team size, system scale (e.g. "On a payment microservice handling 50k RPS..."), and the core technical environment.',
    };

    // 2. Task Analysis
    const taskCues = [
      'my goal', 'my responsibility', 'i needed to', 'we had to', 'the objective',
      'the challenge', 'the requirement', 'target', 'deadline', 'was assigned',
      'needed to fix', 'my task', 'issue was', 'the problem was',
    ];
    const taskSnippet = this.findMatchingSentence(sentences, taskCues);
    const taskPresence = this.assessPresence(taskSnippet, 15);

    const task: StarPillarEvaluationDTO = {
      pillar: 'TASK',
      presence: taskPresence,
      extractedSnippet: taskSnippet,
      feedback:
        taskPresence === 'STRONG' || taskPresence === 'ADEQUATE'
          ? 'Explicit definition of the core challenge, goal, or technical objective.'
          : 'The exact task or goal was ambiguous. Differentiate what the team needed vs your specific personal mandate.',
      suggestedEnhancement:
        'Explicitly state your personal responsibility: "My task was to eliminate database lock contention while ensuring zero data loss during peak migration."',
    };

    // 3. Action Analysis
    const actionCues = [
      'i implemented', 'i designed', 'i investigated', 'i built', 'i analyzed',
      'i proposed', 'i refactored', 'i set up', 'i led', 'i created',
      'i decided', 'i migrated', 'i wrote', 'i scheduled', 'conducted', 'we deployed',
    ];
    const actionSnippet = this.findMatchingSentence(sentences, actionCues);
    const actionPresence = this.assessPresence(actionSnippet, 25);

    const action: StarPillarEvaluationDTO = {
      pillar: 'ACTION',
      presence: actionPresence,
      extractedSnippet: actionSnippet,
      feedback:
        actionPresence === 'STRONG'
          ? 'Comprehensive breakdown of concrete engineering initiatives, technical tools, and decision trade-offs.'
          : actionPresence === 'ADEQUATE'
          ? 'Identified actions taken, but could highlight more granular technical decisions or personal leadership.'
          : 'Action steps were generic or passive. Focus heavily on "I did X using Y" rather than vague team statements.',
      suggestedEnhancement:
        'Detail your exact technical decision process: outline which tools/patterns were chosen (e.g. Redis caching, composite indexing, RFC doc) and why alternative approaches were ruled out.',
    };

    // 4. Result Analysis
    const resultCues = [
      'as a result', 'the outcome', 'reduced', 'improved by', 'increased by',
      'saved', 'shipped on time', 'successfully', 'learned that', 'metric',
      'uptime', 'ms', '%', 'latency', 'costs', 'post-mortem', 'prevented',
    ];
    const resultSnippet = this.findMatchingSentence(sentences, resultCues);
    const resultPresence = this.assessPresence(resultSnippet, 15);

    const result: StarPillarEvaluationDTO = {
      pillar: 'RESULT',
      presence: resultPresence,
      extractedSnippet: resultSnippet,
      feedback:
        resultPresence === 'STRONG'
          ? 'Excellent quantifiable business or technical impact highlighted with clear outcomes.'
          : resultPresence === 'ADEQUATE'
          ? 'Positive resolution stated, but lacks specific quantifiable metrics (e.g. % latency decrease, uptime gain).'
          : 'No measurable outcome or lessons learned provided. Always close with concrete technical results and retrospective reflections.',
      suggestedEnhancement:
        'Quantify your impact with measurable data: "Reduced P99 query latency from 850ms to 45ms, resolved the deployment blocker 2 days early, and instituted automated regression tests."',
    };

    // 5. Completeness Score Calculation (Weighted: S=20%, T=20%, A=35%, R=25%)
    const scoreMap: Record<StarPillarPresence, number> = {
      STRONG: 100,
      ADEQUATE: 75,
      WEAK: 40,
      MISSING: 10,
    };

    const starCompletenessScore = Math.round(
      scoreMap[situationPresence] * 0.2 +
      scoreMap[taskPresence] * 0.2 +
      scoreMap[actionPresence] * 0.35 +
      scoreMap[resultPresence] * 0.25
    );

    // 6. Structured Reformulation
    const cleanSnippet = (snip: string | null, fallback: string) =>
      snip && snip.length > 10 ? snip : fallback;

    const structuredReformulation = `
### Polished STAR Structure:

- **Situation (Context)**: ${cleanSnippet(
      situationSnippet,
      'In a high-throughput production environment encountering critical architecture scalability constraints...'
    )}
- **Task (Goal)**: ${cleanSnippet(
      taskSnippet,
      'My mandate was to eliminate system bottlenecks, align team technical consensus, and ensure zero customer disruption.'
    )}
- **Action (Initiatives)**: ${cleanSnippet(
      actionSnippet,
      'I authored a technical comparison RFC, conducted prototype benchmarks, and implemented an optimized architecture with automated regression guards.'
    )}
- **Result (Impact)**: ${cleanSnippet(
      resultSnippet,
      'Successfully deployed the solution on schedule with a 40% performance improvement, zero regressions, and full stakeholder alignment.'
    )}
`.trim();

    return {
      questionId: question.id,
      pillars: {
        situation,
        task,
        action,
        result,
      },
      starCompletenessScore,
      structuredReformulation,
      formattedAt: new Date().toISOString(),
    };
  }

  private findMatchingSentence(sentences: string[], cues: string[]): string | null {
    for (const s of sentences) {
      const sLower = s.toLowerCase();
      if (cues.some((cue) => sLower.includes(cue))) {
        return s;
      }
    }
    return null;
  }

  private assessPresence(snippet: string | null, minWordCount: number): StarPillarPresence {
    if (!snippet) return 'MISSING';
    const words = snippet.trim().split(/\s+/).length;
    if (words >= minWordCount) return 'STRONG';
    if (words >= 6) return 'ADEQUATE';
    return 'WEAK';
  }
}

export const starFeedbackFormatterService = new StarFeedbackFormatterService();
