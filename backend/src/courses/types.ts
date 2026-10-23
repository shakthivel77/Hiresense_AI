export type ContentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface CourseResourceDTO {
  id: string;
  subtopicId?: string;
  skillId?: string;
  title: string;
  url: string;
  type: 'documentation' | 'tutorial' | 'video' | 'article' | 'course';
  source: string;
  description?: string;
  isFree: boolean;
  status: ContentStatus;
  createdAt: string;
}

export interface CourseSubtopicDTO {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  skillId?: string;
  estimatedMinutes: number;
  status: ContentStatus;
  resources: CourseResourceDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseModuleDTO {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  displayOrder: number;
  status: ContentStatus;
  subtopics: CourseSubtopicDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CourseDTO {
  id: string;
  title: string;
  description: string;
  domainSlug: string;
  difficulty: CourseDifficulty;
  prerequisites: string[];
  estimatedDuration: string;
  learningOutcomes: string[];
  status: ContentStatus;
  modules: CourseModuleDTO[];
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseInput {
  title: string;
  description: string;
  domainSlug: string;
  difficulty?: CourseDifficulty;
  prerequisites?: string[];
  estimatedDuration?: string;
  learningOutcomes?: string[];
  status?: ContentStatus;
}

export interface CreateModuleInput {
  title: string;
  description?: string;
  displayOrder?: number;
  status?: ContentStatus;
}

export interface CreateSubtopicInput {
  title: string;
  description?: string;
  skillId?: string;
  estimatedMinutes?: number;
  status?: ContentStatus;
}

export interface CreateResourceInput {
  title: string;
  url: string;
  type?: 'documentation' | 'tutorial' | 'video' | 'article' | 'course';
  source?: string;
  description?: string;
  isFree?: boolean;
  skillId?: string;
  status?: ContentStatus;
}

export interface CourseQuestionDTO {
  id: string;
  skillId: string;
  subtopicId?: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  difficulty: CourseDifficulty;
  marks: number;
  status: ContentStatus;
  createdAt: string;
}

export interface CreateQuestionInput {
  skillId: string;
  subtopicId?: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation?: string;
  difficulty?: CourseDifficulty;
  marks?: number;
  status?: ContentStatus;
}
