export type SkillDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface DomainDTO {
  id: string;
  slug: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export interface RoadmapDTO {
  id: string;
  domainId: string;
  title: string;
  version: string;
  description?: string;
  createdAt?: string;
}

export interface SkillDTO {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  difficulty: SkillDifficulty;
  createdAt?: string;
}

export interface SkillDependencyDTO {
  id: string;
  skillId: string;
  prerequisiteSkillId: string;
}

export interface SkillGraphNode {
  skill: SkillDTO;
  prerequisiteSkillIds: string[];
  dependentSkillIds: string[];
}

export interface NormalizedRoadmapPayload {
  domain: Omit<DomainDTO, 'id'>;
  roadmap: Omit<RoadmapDTO, 'id' | 'domainId'>;
  skills: Array<Omit<SkillDTO, 'id'>>;
  dependencies: Array<{
    skillSlug: string;
    prerequisiteSlug: string;
  }>;
}
