import {
  CourseDTO,
  CreateCourseInput,
  CourseModuleDTO,
  CreateModuleInput,
  CourseSubtopicDTO,
  CreateSubtopicInput,
  CourseResourceDTO,
  CreateResourceInput,
  CourseQuestionDTO,
  CreateQuestionInput,
  ContentStatus,
} from './types.js';
import { isSupabaseConfigured, getSupabaseClient } from '../common/supabase.js';
import { collegeService } from '../colleges/service.js';

export class CourseService {
  private coursesMap = new Map<string, CourseDTO>();
  private questionsMap = new Map<string, CourseQuestionDTO>();

  constructor() {
    this.seedInitialCourses();
  }

  private seedInitialCourses() {
    const now = new Date().toISOString();

    // 1. Backend Engineering Master Track
    const backendCourseId = 'crs-backend-core-01';
    const backendMod1Id = 'mod-node-arch-01';
    const backendSub1Id = 'sub-node-async-01';

    const backendCourse: CourseDTO = {
      id: backendCourseId,
      title: 'Production Backend Architecture & Node.js Mastery',
      description: 'Master asynchronous event loops, streaming, micro-routing, PostgreSQL relational modeling, and enterprise API security.',
      domainSlug: 'backend-developer',
      difficulty: 'intermediate',
      prerequisites: ['JavaScript ES6+', 'Basic HTTP Concepts'],
      estimatedDuration: '6 weeks',
      learningOutcomes: [
        'Design non-blocking I/O architectures with Node.js and Express',
        'Model normalized database schemas with PostgreSQL and Supabase',
        'Implement robust cryptographic authentication and authorization guards',
      ],
      status: 'PUBLISHED',
      createdAt: now,
      updatedAt: now,
      modules: [
        {
          id: backendMod1Id,
          courseId: backendCourseId,
          title: 'Asynchronous Architecture & Event Loops',
          description: 'Deep dive into libuv, thread pools, streams, and cluster scaling.',
          displayOrder: 1,
          status: 'PUBLISHED',
          createdAt: now,
          updatedAt: now,
          subtopics: [
            {
              id: backendSub1Id,
              moduleId: backendMod1Id,
              title: 'Event Loop Execution & Task Queues',
              description: 'Understanding microtasks, macrotasks, and process.nextTick.',
              skillId: 'nodejs',
              estimatedMinutes: 90,
              status: 'PUBLISHED',
              createdAt: now,
              updatedAt: now,
              resources: [
                {
                  id: 'res-node-el-01',
                  subtopicId: backendSub1Id,
                  skillId: 'nodejs',
                  title: 'Node.js Event Loop Mechanics & Phases',
                  url: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick',
                  type: 'documentation',
                  source: 'Node.js Official Documentation',
                  description: 'Comprehensive guide to timers, pending callbacks, poll, and close phases.',
                  isFree: true,
                  status: 'PUBLISHED',
                  createdAt: now,
                },
                {
                  id: 'res-node-el-02',
                  subtopicId: backendSub1Id,
                  skillId: 'nodejs',
                  title: 'Deep Dive: Node.js Under the Hood',
                  url: 'https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs',
                  type: 'tutorial',
                  source: 'MDN Web Docs',
                  description: 'Hands-on architectural patterns for enterprise Node.js services.',
                  isFree: true,
                  status: 'PUBLISHED',
                  createdAt: now,
                },
              ],
            },
          ],
        },
      ],
    };

    // 2. Modern React Architecture Track
    const frontendCourseId = 'crs-frontend-core-01';
    const frontendMod1Id = 'mod-react-state-01';
    const frontendSub1Id = 'sub-react-concurrency-01';

    const frontendCourse: CourseDTO = {
      id: frontendCourseId,
      title: 'Modern Frontend Engineering with React & TypeScript',
      description: 'Build enterprise-grade single-page applications with declarative state management, custom hooks, and Tailwind CSS design systems.',
      domainSlug: 'frontend-developer',
      difficulty: 'intermediate',
      prerequisites: ['HTML5 / CSS3', 'Modern TypeScript'],
      estimatedDuration: '5 weeks',
      learningOutcomes: [
        'Engineer deterministic component trees and render lifecycles',
        'Construct type-safe data pipelines and custom hooks',
        'Implement accessibility and responsive design tokens',
      ],
      status: 'PUBLISHED',
      createdAt: now,
      updatedAt: now,
      modules: [
        {
          id: frontendMod1Id,
          courseId: frontendCourseId,
          title: 'React Concurrent Rendering & State Engines',
          description: 'Exploring reconciliation, Fiber architecture, and hooks.',
          displayOrder: 1,
          status: 'PUBLISHED',
          createdAt: now,
          updatedAt: now,
          subtopics: [
            {
              id: frontendSub1Id,
              moduleId: frontendMod1Id,
              title: 'Component Lifecycle & Custom Hook Invariants',
              description: 'Preserving purity, closures, and reference stability in React.',
              skillId: 'react',
              estimatedMinutes: 75,
              status: 'PUBLISHED',
              createdAt: now,
              updatedAt: now,
              resources: [
                {
                  id: 'res-react-hooks-01',
                  subtopicId: frontendSub1Id,
                  skillId: 'react',
                  title: 'React Official Hook Rules & Architecture',
                  url: 'https://react.dev/reference/react',
                  type: 'documentation',
                  source: 'React.dev',
                  description: 'Standard rules for built-in hooks, effects, and memoization.',
                  isFree: true,
                  status: 'PUBLISHED',
                  createdAt: now,
                },
              ],
            },
          ],
        },
      ],
    };

    this.coursesMap.set(backendCourse.id, backendCourse);
    this.coursesMap.set(frontendCourse.id, frontendCourse);

    // Seed baseline authoring questions linked to skills
    this.questionsMap.set('q-auth-01', {
      id: 'q-auth-01',
      skillId: 'nodejs',
      subtopicId: backendSub1Id,
      questionText: 'In the Node.js event loop, which queue has priority when processing microtasks after the current operation completes?',
      options: [
        'process.nextTick queue before Promise microtask queue',
        'Promise microtask queue before process.nextTick queue',
        'Check phase (setImmediate) queue',
        'Timers phase queue',
      ],
      correctOptionIndex: 0,
      explanation: 'process.nextTick callbacks are resolved immediately after the current operation finishes and before other microtasks (such as Promise.then callbacks).',
      difficulty: 'intermediate',
      marks: 2,
      status: 'PUBLISHED',
      createdAt: now,
    });

    this.questionsMap.set('q-auth-02', {
      id: 'q-auth-02',
      skillId: 'react',
      subtopicId: frontendSub1Id,
      questionText: 'Why must React hooks strictly be called at the top level of a component rather than inside loops or conditions?',
      options: [
        'To allow React to preserve state identity by maintaining an identical hook call order across renders',
        'To improve JavaScript V8 compilation speed',
        'Because hooks are asynchronous and cannot run synchronously inside conditions',
        'To prevent memory leaks in the browser Garbage Collector',
      ],
      correctOptionIndex: 0,
      explanation: 'React relies on the order in which hooks are called to know which state belongs to which useState or useEffect call across re-renders.',
      difficulty: 'intermediate',
      marks: 2,
      status: 'PUBLISHED',
      createdAt: now,
    });
  }

  // ============================================================================
  // Course Lifecycle Management
  // ============================================================================

  public async getCourses(publishedOnly = true, domainSlug?: string): Promise<CourseDTO[]> {
    let list = Array.from(this.coursesMap.values());

    if (publishedOnly) {
      list = list.filter((c) => c.status === 'PUBLISHED');
    }
    if (domainSlug) {
      list = list.filter((c) => c.domainSlug === domainSlug);
    }

    return list.sort((a, b) => a.title.localeCompare(b.title));
  }

  public async getCourseById(id: string, publishedOnly = false): Promise<CourseDTO | null> {
    const course = this.coursesMap.get(id);
    if (!course) return null;
    if (publishedOnly && course.status !== 'PUBLISHED') return null;
    return course;
  }

  public async createCourse(input: CreateCourseInput, actorId: string): Promise<CourseDTO> {
    if (!input.title || !input.description || !input.domainSlug) {
      throw new Error('Title, description, and domainSlug are required.');
    }

    const id = 'crs-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const course: CourseDTO = {
      id,
      title: input.title.trim(),
      description: input.description.trim(),
      domainSlug: input.domainSlug.trim(),
      difficulty: input.difficulty || 'intermediate',
      prerequisites: input.prerequisites || [],
      estimatedDuration: input.estimatedDuration || '4 weeks',
      learningOutcomes: input.learningOutcomes || [],
      status: input.status || 'DRAFT',
      modules: [],
      createdBy: actorId,
      createdAt: now,
      updatedAt: now,
    };

    this.coursesMap.set(id, course);

    collegeService.logAction(actorId, 'MAIN_ADMIN', 'CREATE_COURSE', 'course', id, {
      title: course.title,
      domainSlug: course.domainSlug,
    });

    return course;
  }

  public async updateCourse(id: string, updates: Partial<CreateCourseInput>, actorId: string): Promise<CourseDTO> {
    const course = this.coursesMap.get(id);
    if (!course) throw new Error('Course not found.');

    const updated: CourseDTO = {
      ...course,
      ...(updates.title && { title: updates.title.trim() }),
      ...(updates.description && { description: updates.description.trim() }),
      ...(updates.domainSlug && { domainSlug: updates.domainSlug.trim() }),
      ...(updates.difficulty && { difficulty: updates.difficulty }),
      ...(updates.prerequisites && { prerequisites: updates.prerequisites }),
      ...(updates.estimatedDuration && { estimatedDuration: updates.estimatedDuration }),
      ...(updates.learningOutcomes && { learningOutcomes: updates.learningOutcomes }),
      ...(updates.status && { status: updates.status }),
      updatedAt: new Date().toISOString(),
    };

    this.coursesMap.set(id, updated);

    collegeService.logAction(actorId, 'MAIN_ADMIN', 'UPDATE_COURSE', 'course', id, updates);
    return updated;
  }

  public async setCourseStatus(id: string, status: ContentStatus, actorId: string): Promise<CourseDTO> {
    return this.updateCourse(id, { status }, actorId);
  }

  // ============================================================================
  // Modules & Subtopics
  // ============================================================================

  public async addModule(courseId: string, input: CreateModuleInput, actorId: string): Promise<CourseModuleDTO> {
    const course = this.coursesMap.get(courseId);
    if (!course) throw new Error('Course not found.');

    const id = 'mod-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const module: CourseModuleDTO = {
      id,
      courseId,
      title: input.title.trim(),
      description: input.description?.trim(),
      displayOrder: input.displayOrder || course.modules.length + 1,
      status: input.status || 'DRAFT',
      subtopics: [],
      createdAt: now,
      updatedAt: now,
    };

    course.modules.push(module);
    course.updatedAt = now;

    collegeService.logAction(actorId, 'MAIN_ADMIN', 'CREATE_MODULE', 'course_module', id, {
      courseId,
      title: module.title,
    });

    return module;
  }

  public async addSubtopic(
    courseId: string,
    moduleId: string,
    input: CreateSubtopicInput,
    actorId: string
  ): Promise<CourseSubtopicDTO> {
    const course = this.coursesMap.get(courseId);
    if (!course) throw new Error('Course not found.');

    const module = course.modules.find((m) => m.id === moduleId);
    if (!module) throw new Error('Module not found in this course.');

    const id = 'sub-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const subtopic: CourseSubtopicDTO = {
      id,
      moduleId,
      title: input.title.trim(),
      description: input.description?.trim(),
      skillId: input.skillId?.trim(),
      estimatedMinutes: input.estimatedMinutes || 60,
      status: input.status || 'DRAFT',
      resources: [],
      createdAt: now,
      updatedAt: now,
    };

    module.subtopics.push(subtopic);
    course.updatedAt = now;

    collegeService.logAction(actorId, 'MAIN_ADMIN', 'CREATE_SUBTOPIC', 'course_subtopic', id, {
      moduleId,
      title: subtopic.title,
      skillId: subtopic.skillId,
    });

    return subtopic;
  }

  public async addResourceToSubtopic(
    courseId: string,
    moduleId: string,
    subtopicId: string,
    input: CreateResourceInput,
    actorId: string
  ): Promise<CourseResourceDTO> {
    const course = this.coursesMap.get(courseId);
    if (!course) throw new Error('Course not found.');

    const module = course.modules.find((m) => m.id === moduleId);
    if (!module) throw new Error('Module not found.');

    const subtopic = module.subtopics.find((s) => s.id === subtopicId);
    if (!subtopic) throw new Error('Subtopic not found.');

    // URL validation
    try {
      new URL(input.url);
    } catch {
      throw new Error('A valid HTTP or HTTPS resource URL is required.');
    }

    const id = 'res-' + Math.random().toString(36).substring(2, 9);
    const resource: CourseResourceDTO = {
      id,
      subtopicId,
      skillId: input.skillId || subtopic.skillId,
      title: input.title.trim(),
      url: input.url.trim(),
      type: input.type || 'article',
      source: input.source?.trim() || 'Official Reference',
      description: input.description?.trim(),
      isFree: input.isFree !== false,
      status: input.status || 'PUBLISHED',
      createdAt: new Date().toISOString(),
    };

    subtopic.resources.push(resource);
    course.updatedAt = new Date().toISOString();

    collegeService.logAction(actorId, 'MAIN_ADMIN', 'ADD_RESOURCE', 'course_resource', id, {
      subtopicId,
      title: resource.title,
    });

    return resource;
  }

  // ============================================================================
  // Centralized Question Bank Authoring
  // ============================================================================

  public async getQuestions(skillId?: string, status?: ContentStatus): Promise<CourseQuestionDTO[]> {
    let list = Array.from(this.questionsMap.values());
    if (skillId) list = list.filter((q) => q.skillId === skillId);
    if (status) list = list.filter((q) => q.status === status);
    return list;
  }

  public async createQuestion(input: CreateQuestionInput, actorId: string): Promise<CourseQuestionDTO> {
    if (!input.questionText || !input.options || input.options.length < 2) {
      throw new Error('Question text and at least 2 options are required.');
    }
    if (
      typeof input.correctOptionIndex !== 'number' ||
      input.correctOptionIndex < 0 ||
      input.correctOptionIndex >= input.options.length
    ) {
      throw new Error('Valid correctOptionIndex within options bounds is required.');
    }

    const id = 'q-' + Math.random().toString(36).substring(2, 9);
    const now = new Date().toISOString();

    const question: CourseQuestionDTO = {
      id,
      skillId: input.skillId,
      subtopicId: input.subtopicId,
      questionText: input.questionText.trim(),
      options: input.options.map((o) => o.trim()),
      correctOptionIndex: input.correctOptionIndex,
      explanation: input.explanation?.trim(),
      difficulty: input.difficulty || 'intermediate',
      marks: input.marks || 1,
      status: input.status || 'PUBLISHED',
      createdAt: now,
    };

    this.questionsMap.set(id, question);

    collegeService.logAction(actorId, 'MAIN_ADMIN', 'CREATE_QUESTION', 'assessment_question', id, {
      skillId: question.skillId,
      difficulty: question.difficulty,
    });

    return question;
  }

  public async updateQuestion(
    id: string,
    updates: Partial<CreateQuestionInput>,
    actorId: string
  ): Promise<CourseQuestionDTO> {
    const question = this.questionsMap.get(id);
    if (!question) throw new Error('Question not found.');

    if (updates.options && updates.options.length < 2) {
      throw new Error('At least 2 options required.');
    }

    const updated: CourseQuestionDTO = {
      ...question,
      ...(updates.skillId && { skillId: updates.skillId }),
      ...(updates.subtopicId !== undefined && { subtopicId: updates.subtopicId }),
      ...(updates.questionText && { questionText: updates.questionText.trim() }),
      ...(updates.options && { options: updates.options.map((o) => o.trim()) }),
      ...(typeof updates.correctOptionIndex === 'number' && { correctOptionIndex: updates.correctOptionIndex }),
      ...(updates.explanation !== undefined && { explanation: updates.explanation?.trim() }),
      ...(updates.difficulty && { difficulty: updates.difficulty }),
      ...(updates.marks !== undefined && { marks: updates.marks }),
      ...(updates.status && { status: updates.status }),
    };

    this.questionsMap.set(id, updated);

    collegeService.logAction(actorId, 'MAIN_ADMIN', 'UPDATE_QUESTION', 'assessment_question', id, updates);
    return updated;
  }
}

export const courseService = new CourseService();
