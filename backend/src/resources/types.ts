export type ResourceType = 'documentation' | 'tutorial' | 'video' | 'article' | 'course';

export interface ResourceDTO {
  id: string;
  skillSlug: string;
  title: string;
  url: string;
  type: ResourceType;
  source: string;
  description?: string;
  isFree: boolean;
}
