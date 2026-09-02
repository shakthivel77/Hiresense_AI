import { NormalizedRoadmapPayload, SkillDifficulty } from './types.js';

export interface ExternalRoadmapNode {
  title: string;
  description?: string;
  category?: string;
  difficulty?: string;
  prerequisites?: string[]; // Array of prerequisite titles or slugs
}

export interface ExternalRoadmapData {
  domainSlug: string;
  domainName: string;
  domainDescription?: string;
  roadmapTitle: string;
  version?: string;
  nodes: ExternalRoadmapNode[];
}

export interface RoadmapAdapter {
  parseRoadmap(externalData: ExternalRoadmapData): NormalizedRoadmapPayload;
}

export class StandardRoadmapAdapter implements RoadmapAdapter {
  parseRoadmap(data: ExternalRoadmapData): NormalizedRoadmapPayload {
    const slugify = (text: string) =>
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const domainSlug = slugify(data.domainSlug || data.domainName);

    const skills = data.nodes.map((node) => {
      const difficulty: SkillDifficulty =
        node.difficulty === 'beginner' || node.difficulty === 'advanced'
          ? node.difficulty
          : 'intermediate';

      return {
        slug: slugify(node.title),
        name: node.title,
        description: node.description || `Learning track for ${node.title}`,
        category: node.category || 'core',
        difficulty,
      };
    });

    const dependencies: Array<{ skillSlug: string; prerequisiteSlug: string }> = [];

    data.nodes.forEach((node) => {
      const skillSlug = slugify(node.title);
      if (node.prerequisites && Array.isArray(node.prerequisites)) {
        node.prerequisites.forEach((prereq) => {
          dependencies.push({
            skillSlug,
            prerequisiteSlug: slugify(prereq),
          });
        });
      }
    });

    return {
      domain: {
        slug: domainSlug,
        name: data.domainName,
        description: data.domainDescription || `${data.domainName} learning path`,
      },
      roadmap: {
        title: data.roadmapTitle,
        version: data.version || '1.0.0',
        description: `${data.domainName} core skill graph`,
      },
      skills,
      dependencies,
    };
  }
}
