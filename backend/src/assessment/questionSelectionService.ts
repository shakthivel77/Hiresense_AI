import { QuestionDTO, CreateQuestionDTO } from './types.js';
import { questionBankService } from './questionBankService.js';

export class QuestionSelectionService {
  /**
   * Randomly select a balanced set of questions from the skill's question pool
   * @param skillId The skill to select questions for
   * @param count The number of questions to select (default: 5)
   */
  public async selectQuestionsForTest(skillId: string, count = 5): Promise<QuestionDTO[]> {
    // 1. Ensure a valid question pool exists
    await this.ensureQuestionPool(skillId);

    // 2. Fetch all authoritative questions for the skill
    const questions = (await questionBankService.getQuestionsForSkill(skillId, true)) as QuestionDTO[];

    if (questions.length === 0) {
      throw new Error(`No questions available for skill '${skillId}'`);
    }

    // If pool is smaller than requested count, return full shuffled pool
    if (questions.length <= count) {
      return this.shuffle([...questions]);
    }

    // 3. Balanced selection across difficulty tiers if present
    const beginners = this.shuffle(questions.filter((q) => q.difficulty === 'beginner'));
    const intermediates = this.shuffle(questions.filter((q) => q.difficulty === 'intermediate'));
    const advanceds = this.shuffle(questions.filter((q) => q.difficulty === 'advanced'));

    const selected: QuestionDTO[] = [];

    // Target distribution: ~30% beginner, ~50% intermediate, ~20% advanced
    const beginnerTarget = Math.max(1, Math.floor(count * 0.3));
    const intermediateTarget = Math.max(1, Math.floor(count * 0.5));
    const advancedTarget = Math.max(1, count - (beginnerTarget + intermediateTarget));

    selected.push(...beginners.slice(0, beginnerTarget));
    selected.push(...intermediates.slice(0, intermediateTarget));
    selected.push(...advanceds.slice(0, advancedTarget));

    // Fill any remaining slots if a specific tier had fewer items
    if (selected.length < count) {
      const selectedIds = new Set(selected.map((q) => q.id));
      const remaining = this.shuffle(questions.filter((q) => !selectedIds.has(q.id)));
      selected.push(...remaining.slice(0, count - selected.length));
    }

    return this.shuffle(selected.slice(0, count));
  }

  /**
   * Fisher-Yates array shuffle algorithm
   */
  public shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  /**
   * Ensure question pool exists with baseline questions for roadmap skills
   */
  public async ensureQuestionPool(skillId: string): Promise<void> {
    const existing = await questionBankService.getQuestionBankBySkillId(skillId);
    const questions = await questionBankService.getQuestionsForSkill(skillId, false);

    if (existing && questions.length >= 3) {
      return;
    }

    const bank = await questionBankService.createQuestionBank(
      skillId,
      `${skillId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Assessment Bank`
    );

    // Provide default fallback questions for the skill
    const defaultQuestions: CreateQuestionDTO[] = [
      {
        questionText: `Which of the following is considered a core industry best practice when implementing ${skillId.replace(/-/g, ' ')}?`,
        options: [
          'Ensuring strict modular separation of concerns and clear interfaces',
          'Hardcoding configuration values directly in production components',
          'Disabling automated error logging to improve speed',
          'Avoiding type safety and schema validation in critical pipelines',
        ],
        correctOptionIndex: 0,
        explanation: 'Separation of concerns and modularity are universal engineering best practices.',
        difficulty: 'beginner',
      },
      {
        questionText: `When scaling applications utilizing ${skillId.replace(/-/g, ' ')}, which strategy is most effective?`,
        options: [
          'Horizontal scaling with stateless services and distributed caching',
          'Storing state exclusively in single-instance local memory',
          'Increasing CPU clock speed on a single server without partitioning',
          'Disabling database indexes to speed up write operations',
        ],
        correctOptionIndex: 0,
        explanation: 'Horizontal scaling with caching and stateless execution provides predictable scalability.',
        difficulty: 'intermediate',
      },
      {
        questionText: `How should security and validation be enforced when handling inputs in ${skillId.replace(/-/g, ' ')}?`,
        options: [
          'Strict schema validation and authorization checks at server boundaries',
          'Relying solely on client-side form validation',
          'Assuming all incoming internal network requests are pre-trusted',
          'Bypassing authentication for read-only query parameters',
        ],
        correctOptionIndex: 0,
        explanation: 'Server-side validation and authentication boundaries protect against unauthorized mutations.',
        difficulty: 'intermediate',
      },
      {
        questionText: `In complex architectures involving ${skillId.replace(/-/g, ' ')}, how should error propagation be designed?`,
        options: [
          'Structured error codes, contextual logging, and graceful degradation',
          'Silently swallowing exceptions to prevent crash logs',
          'Exposing raw database stack traces directly to the end user',
          'Restarting the entire application process on any network timeout',
        ],
        correctOptionIndex: 0,
        explanation: 'Structured errors with context allow deterministic troubleshooting without leaking system internals.',
        difficulty: 'advanced',
      },
    ];

    await questionBankService.addQuestionsToBank(bank.id, defaultQuestions);
  }
}

export const questionSelectionService = new QuestionSelectionService();
