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

export interface ResourcesResponse {
  success: boolean;
  data: {
    resources: ResourceDTO[];
  };
  error?: {
    code: string;
    message: string;
  };
}

export async function fetchSkillResources(skillSlug: string): Promise<ResourceDTO[]> {
  const res = await fetch(`/api/resources/${encodeURIComponent(skillSlug)}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch resources for ${skillSlug}: HTTP ${res.status}`);
  }
  const json: ResourcesResponse = await res.json();
  if (!json.success || !json.data) {
    throw new Error(json.error?.message || 'Failed to retrieve skill resources');
  }
  return json.data.resources;
}
