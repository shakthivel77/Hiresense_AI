import { randomUUID } from 'crypto';
import {
  QuestionBankDTO,
  QuestionDTO,
  PublicQuestionDTO,
  CreateQuestionDTO,
  sanitizeQuestionForClient,
} from './types.js';
import { isSupabaseConfigured, getSupabaseClient } from '../common/supabase.js';

export class QuestionBankService {
  private banksMap = new Map<string, QuestionBankDTO>(); // id -> Bank
  private skillBankMap = new Map<string, string>(); // skillId -> bankId
  private questionsMap = new Map<string, QuestionDTO>(); // id -> Question
  private bankQuestionsMap = new Map<string, string[]>(); // bankId -> questionId[]

  constructor() {
    this.seedInitialQuestionBanks();
  }

  /**
   * Create or get question bank for a skill
   */
  public async createQuestionBank(skillId: string, title: string): Promise<QuestionBankDTO> {
    const existingBankId = this.skillBankMap.get(skillId);
    if (existingBankId && this.banksMap.has(existingBankId)) {
      return this.banksMap.get(existingBankId)!;
    }

    const now = new Date().toISOString();
    const bank: QuestionBankDTO = {
      id: randomUUID(),
      skillId,
      title,
      createdAt: now,
    };

    this.banksMap.set(bank.id, bank);
    this.skillBankMap.set(skillId, bank.id);
    this.bankQuestionsMap.set(bank.id, []);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        await supabase.from('question_banks').upsert({
          id: bank.id,
          skill_id: bank.skillId,
          title: bank.title,
          created_at: bank.createdAt,
        });
      } catch (err) {
        console.warn('[QuestionBankService] Supabase sync deferred:', err);
      }
    }

    return bank;
  }

  /**
   * Add a batch of questions to a question bank
   */
  public async addQuestionsToBank(
    questionBankId: string,
    questions: CreateQuestionDTO[]
  ): Promise<QuestionDTO[]> {
    const bank = this.banksMap.get(questionBankId);
    if (!bank) {
      throw new Error(`Question bank with id '${questionBankId}' not found`);
    }

    const createdQuestions: QuestionDTO[] = [];
    const questionIds = this.bankQuestionsMap.get(questionBankId) || [];

    for (const q of questions) {
      if (!q.options || q.options.length < 2) {
        throw new Error('Question must have at least 2 options');
      }
      if (q.correctOptionIndex < 0 || q.correctOptionIndex >= q.options.length) {
        throw new Error('correctOptionIndex is out of bounds');
      }

      const questionRecord: QuestionDTO = {
        id: randomUUID(),
        questionBankId,
        questionText: q.questionText.trim(),
        options: q.options.map((opt) => opt.trim()),
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation?.trim(),
        difficulty: q.difficulty || 'intermediate',
        createdAt: new Date().toISOString(),
      };

      this.questionsMap.set(questionRecord.id, questionRecord);
      questionIds.push(questionRecord.id);
      createdQuestions.push(questionRecord);

      if (isSupabaseConfigured()) {
        try {
          const supabase = getSupabaseClient();
          void supabase.from('questions').upsert({
            id: questionRecord.id,
            question_bank_id: questionRecord.questionBankId,
            question_text: questionRecord.questionText,
            options: questionRecord.options,
            correct_option_index: questionRecord.correctOptionIndex,
            explanation: questionRecord.explanation,
            difficulty: questionRecord.difficulty,
            created_at: questionRecord.createdAt,
          });
        } catch (err) {
          console.warn('[QuestionBankService] Supabase question insert deferred:', err);
        }
      }
    }

    this.bankQuestionsMap.set(questionBankId, questionIds);
    return createdQuestions;
  }

  /**
   * Get Question Bank metadata by skillId
   */
  public async getQuestionBankBySkillId(skillId: string): Promise<QuestionBankDTO | null> {
    const bankId = this.skillBankMap.get(skillId);
    if (!bankId) return null;
    const bank = this.banksMap.get(bankId);
    if (!bank) return null;

    const count = (this.bankQuestionsMap.get(bankId) || []).length;
    return {
      ...bank,
      totalQuestions: count,
    };
  }

  /**
   * Get questions for a skill (Sanitizes answer keys unless internal server request)
   */
  public async getQuestionsForSkill(
    skillId: string,
    includeAnswers = false
  ): Promise<QuestionDTO[] | PublicQuestionDTO[]> {
    const bankId = this.skillBankMap.get(skillId);
    if (!bankId) return [];

    const qIds = this.bankQuestionsMap.get(bankId) || [];
    const questions = qIds
      .map((id) => this.questionsMap.get(id))
      .filter((q): q is QuestionDTO => Boolean(q));

    if (includeAnswers) {
      return questions;
    }

    return questions.map(sanitizeQuestionForClient);
  }

  /**
   * Retrieve authoritative question by ID (Internal scoring only)
   */
  public async getQuestionById(questionId: string): Promise<QuestionDTO | null> {
    return this.questionsMap.get(questionId) || null;
  }

  /**
   * Pre-seed standard core question banks
   */
  public seedInitialQuestionBanks(): void {
    // 1. Internet Basics Questions
    const bank1Id = 'bank-internet-basics';
    const bank1: QuestionBankDTO = {
      id: bank1Id,
      skillId: 'internet-basics',
      title: 'Internet Basics Assessment Pool',
      createdAt: new Date().toISOString(),
    };
    this.banksMap.set(bank1.id, bank1);
    this.skillBankMap.set('internet-basics', bank1.id);

    const q1List: CreateQuestionDTO[] = [
      {
        questionText: 'What is the primary function of the Domain Name System (DNS)?',
        options: [
          'Encrypting web traffic between client and server',
          'Translating human-readable domain names into IP addresses',
          'Routing packets across physical fiber cables',
          'Assigning MAC addresses to network interfaces',
        ],
        correctOptionIndex: 1,
        explanation: 'DNS acts as the phonebook of the Internet, resolving domain names (like example.com) to IP addresses.',
        difficulty: 'beginner',
      },
      {
        questionText: 'Which HTTP status code signifies that a requested resource was successfully created on the server?',
        options: ['200 OK', '201 Created', '204 No Content', '301 Moved Permanently'],
        correctOptionIndex: 1,
        explanation: 'HTTP 201 Created indicates that the request succeeded and a new resource was created as a result.',
        difficulty: 'beginner',
      },
      {
        questionText: 'What is the main difference between TCP and UDP protocols?',
        options: [
          'TCP is connection-oriented and guarantees delivery; UDP is connectionless and faster',
          'UDP provides encryption while TCP does not',
          'TCP is only used for local networks; UDP is used for the Internet',
          'UDP guarantees ordered delivery of packets; TCP drops lost packets',
        ],
        correctOptionIndex: 0,
        explanation: 'TCP establishes a connection via a 3-way handshake and guarantees delivery, whereas UDP transmits packets without delivery guarantees for lower latency.',
        difficulty: 'intermediate',
      },
      {
        questionText: 'What purpose does the TLS/SSL handshake serve in HTTPS?',
        options: [
          'Compresses HTML files before transmission',
          'Establishes an encrypted symmetric session key between client and server',
          'Caches static assets on edge CDN nodes',
          'Converts IPv4 addresses into IPv6 addresses',
        ],
        correctOptionIndex: 1,
        explanation: 'The TLS handshake authenticates the server and negotiates symmetric encryption keys to secure the communication channel.',
        difficulty: 'intermediate',
      },
      {
        questionText: 'Which of the following headers is used by browsers to prevent Cross-Site Scripting (XSS)?',
        options: [
          'Access-Control-Allow-Origin',
          'Content-Security-Policy',
          'Cache-Control',
          'X-Forwarded-For',
        ],
        correctOptionIndex: 1,
        explanation: 'Content-Security-Policy (CSP) restricts the resources (scripts, images) that the browser is allowed to load for a given page.',
        difficulty: 'advanced',
      },
    ];

    // 2. Relational Databases Questions
    const bank2Id = 'bank-relational-databases';
    const bank2: QuestionBankDTO = {
      id: bank2Id,
      skillId: 'relational-databases',
      title: 'Relational Databases Assessment Pool',
      createdAt: new Date().toISOString(),
    };
    this.banksMap.set(bank2.id, bank2);
    this.skillBankMap.set('relational-databases', bank2.id);

    const q2List: CreateQuestionDTO[] = [
      {
        questionText: 'What does the "I" stand for in the ACID transaction properties?',
        options: ['Integrity', 'Isolation', 'Indexing', 'Idempotency'],
        correctOptionIndex: 1,
        explanation: 'ACID stands for Atomicity, Consistency, Isolation, and Durability.',
        difficulty: 'beginner',
      },
      {
        questionText: 'Which SQL statement is used to remove all rows from a table without logging individual row deletions?',
        options: ['DELETE FROM table;', 'DROP TABLE table;', 'TRUNCATE TABLE table;', 'REMOVE ALL FROM table;'],
        correctOptionIndex: 2,
        explanation: 'TRUNCATE TABLE quickly removes all rows from a table by deallocating pages, typically bypassing individual row delete triggers and logging.',
        difficulty: 'intermediate',
      },
      {
        questionText: 'What data structure is most commonly used by relational database engines for primary key indexes?',
        options: ['Binary Search Tree', 'B-Tree / B+ Tree', 'Linked List', 'Hash Ring'],
        correctOptionIndex: 1,
        explanation: 'B-Trees and B+ Trees keep data sorted and allow search, sequential access, insertions, and deletions in logarithmic time.',
        difficulty: 'intermediate',
      },
      {
        questionText: 'In PostgreSQL, what is the purpose of the EXPLAIN ANALYZE command?',
        options: [
          'Checks table syntax and repairs corrupt indexes',
          'Executes the query and displays the actual execution plan with node runtimes and row counts',
          'Exports database schema to an SQL file',
          'Runs background vacuuming on bloated tables',
        ],
        correctOptionIndex: 1,
        explanation: 'EXPLAIN ANALYZE runs the statement and measures the actual time spent within each plan node.',
        difficulty: 'advanced',
      },
    ];

    void this.addQuestionsToBank(bank1Id, q1List);
    void this.addQuestionsToBank(bank2Id, q2List);
  }
}

export const questionBankService = new QuestionBankService();
