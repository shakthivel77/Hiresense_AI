import { randomUUID } from 'crypto';
import { StandardRoadmapAdapter, ExternalRoadmapData } from './adapter.js';
import {
  DomainDTO,
  RoadmapDTO,
  SkillDTO,
  SkillDependencyDTO,
  SkillGraphNode,
  NormalizedRoadmapPayload,
} from './types.js';
import { isSupabaseConfigured, getSupabaseClient } from '../common/index.js';

export class RoadmapService {
  private domainsMap = new Map<string, DomainDTO>();
  private roadmapsMap = new Map<string, RoadmapDTO>();
  private skillsMap = new Map<string, SkillDTO>();
  private dependencies: SkillDependencyDTO[] = [];
  private domainSkillMap = new Map<string, Set<string>>();

  constructor() {
    this.seedInitialRoadmaps();
  }

  /**
   * Import a normalized roadmap payload into store.
   */
  public async importRoadmap(payload: NormalizedRoadmapPayload): Promise<{
    domain: DomainDTO;
    roadmap: RoadmapDTO;
    skillsCount: number;
    dependenciesCount: number;
  }> {
    // 1. Domain
    let domain = Array.from(this.domainsMap.values()).find(
      (d) => d.slug === payload.domain.slug
    );
    if (!domain) {
      domain = {
        id: randomUUID(),
        slug: payload.domain.slug,
        name: payload.domain.name,
        description: payload.domain.description,
        createdAt: new Date().toISOString(),
      };
      this.domainsMap.set(domain.id, domain);
    }

    // 2. Roadmap
    let roadmap = Array.from(this.roadmapsMap.values()).find(
      (r) => r.domainId === domain!.id && r.title === payload.roadmap.title
    );
    if (!roadmap) {
      roadmap = {
        id: randomUUID(),
        domainId: domain.id,
        title: payload.roadmap.title,
        version: payload.roadmap.version,
        description: payload.roadmap.description,
        createdAt: new Date().toISOString(),
      };
      this.roadmapsMap.set(roadmap.id, roadmap);
    }

    if (!this.domainSkillMap.has(domain.slug)) {
      this.domainSkillMap.set(domain.slug, new Set<string>());
    }
    const skillSetForDomain = this.domainSkillMap.get(domain.slug)!;

    // 3. Skills (Upsert by slug to support cross-domain reuse)
    for (const s of payload.skills) {
      let skill = Array.from(this.skillsMap.values()).find((sk) => sk.slug === s.slug);
      if (!skill) {
        skill = {
          id: randomUUID(),
          slug: s.slug,
          name: s.name,
          description: s.description,
          category: s.category,
          difficulty: s.difficulty,
          createdAt: new Date().toISOString(),
        };
        this.skillsMap.set(skill.id, skill);
      }
      skillSetForDomain.add(skill.id);
    }

    // 4. Dependencies
    let importedDepsCount = 0;
    for (const dep of payload.dependencies) {
      const targetSkill = Array.from(this.skillsMap.values()).find(
        (sk) => sk.slug === dep.skillSlug
      );
      const prereqSkill = Array.from(this.skillsMap.values()).find(
        (sk) => sk.slug === dep.prerequisiteSlug
      );

      if (targetSkill && prereqSkill) {
        const existingDep = this.dependencies.find(
          (d) =>
            d.skillId === targetSkill.id &&
            d.prerequisiteSkillId === prereqSkill.id
        );
        if (!existingDep) {
          const newDep: SkillDependencyDTO = {
            id: randomUUID(),
            skillId: targetSkill.id,
            prerequisiteSkillId: prereqSkill.id,
          };
          this.dependencies.push(newDep);
          importedDepsCount++;
        }
      }
    }

    // Optional DB synchronization if Supabase is live
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        await supabase.from('domains').upsert({
          id: domain.id,
          slug: domain.slug,
          name: domain.name,
          description: domain.description,
        });

        await supabase.from('roadmaps').upsert({
          id: roadmap.id,
          domain_id: roadmap.domainId,
          title: roadmap.title,
          version: roadmap.version,
          description: roadmap.description,
        });
      } catch (err) {
        console.warn('[RoadmapService] Supabase sync deferred:', err);
      }
    }

    return {
      domain,
      roadmap,
      skillsCount: payload.skills.length,
      dependenciesCount: importedDepsCount,
    };
  }

  /**
   * Get all available domains
   */
  public async getDomains(): Promise<DomainDTO[]> {
    return Array.from(this.domainsMap.values());
  }

  /**
   * Get complete skill graph for a given domain slug
   */
  public async getRoadmapGraph(domainSlug: string): Promise<{
    domain: DomainDTO;
    roadmap: RoadmapDTO;
    nodes: SkillGraphNode[];
  } | null> {
    const domain = Array.from(this.domainsMap.values()).find(
      (d) => d.slug === domainSlug
    );
    if (!domain) return null;

    const roadmap = Array.from(this.roadmapsMap.values()).find(
      (r) => r.domainId === domain.id
    );
    if (!roadmap) return null;

    const skillIds = this.domainSkillMap.get(domainSlug) || new Set<string>();
    const domainSkills = Array.from(skillIds)
      .map((id) => this.skillsMap.get(id))
      .filter((s): s is SkillDTO => Boolean(s));

    const nodes: SkillGraphNode[] = domainSkills.map((skill) => {
      const prerequisiteSkillIds = this.dependencies
        .filter((dep) => dep.skillId === skill.id)
        .map((dep) => dep.prerequisiteSkillId);

      const dependentSkillIds = this.dependencies
        .filter((dep) => dep.prerequisiteSkillId === skill.id)
        .map((dep) => dep.skillId);

      return {
        skill,
        prerequisiteSkillIds,
        dependentSkillIds,
      };
    });

    return {
      domain,
      roadmap,
      nodes,
    };
  }

  /**
   * Get skill by ID or slug
   */
  public getSkillById(skillId: string): SkillDTO | null {
    return this.skillsMap.get(skillId) || null;
  }

  /**
   * Get all registered skill dependencies
   */
  public getDependencies(): SkillDependencyDTO[] {
    return [...this.dependencies];
  }

  /**
   * Pre-load standard domains into roadmap store
   */
  public seedInitialRoadmaps(): void {
    const adapter = new StandardRoadmapAdapter();

    const initialDomains: ExternalRoadmapData[] = [
      {
        domainSlug: 'backend-developer',
        domainName: 'Backend Developer',
        domainDescription: 'Master server-side architecture, APIs, databases, and microservices.',
        roadmapTitle: 'Backend Development Roadmap',
        version: '1.0.0',
        nodes: [
          { title: 'Internet Basics', category: 'fundamentals', difficulty: 'beginner' },
          { title: 'Operating Systems & CLI', category: 'fundamentals', difficulty: 'beginner', prerequisites: ['Internet Basics'] },
          { title: 'Programming Languages', category: 'core', difficulty: 'beginner', prerequisites: ['Internet Basics'] },
          { title: 'Relational Databases', category: 'database', difficulty: 'intermediate', prerequisites: ['Programming Languages'] },
          { title: 'Version Control', category: 'tooling', difficulty: 'beginner', prerequisites: ['Operating Systems & CLI'] },
          { title: 'REST APIs', category: 'architecture', difficulty: 'intermediate', prerequisites: ['Programming Languages', 'Relational Databases'] },
          { title: 'Authentication & Security', category: 'security', difficulty: 'intermediate', prerequisites: ['REST APIs'] },
          { title: 'Caching & Performance', category: 'performance', difficulty: 'advanced', prerequisites: ['REST APIs', 'Relational Databases'] },
          { title: 'System Design & Microservices', category: 'architecture', difficulty: 'advanced', prerequisites: ['Authentication & Security', 'Caching & Performance'] },
        ],
      },
      {
        domainSlug: 'frontend-developer',
        domainName: 'Frontend Developer',
        domainDescription: 'Master client-side user interfaces, modern JavaScript frameworks, and web performance.',
        roadmapTitle: 'Frontend Development Roadmap',
        version: '1.0.0',
        nodes: [
          { title: 'Internet Basics', category: 'fundamentals', difficulty: 'beginner' },
          { title: 'HTML & CSS', category: 'fundamentals', difficulty: 'beginner', prerequisites: ['Internet Basics'] },
          { title: 'JavaScript Fundamentals', category: 'core', difficulty: 'beginner', prerequisites: ['HTML & CSS'] },
          { title: 'Version Control', category: 'tooling', difficulty: 'beginner', prerequisites: ['Internet Basics'] },
          { title: 'React Framework', category: 'framework', difficulty: 'intermediate', prerequisites: ['JavaScript Fundamentals'] },
          { title: 'CSS Frameworks & Tailwind', category: 'styling', difficulty: 'intermediate', prerequisites: ['HTML & CSS'] },
          { title: 'State Management', category: 'architecture', difficulty: 'intermediate', prerequisites: ['React Framework'] },
          { title: 'Frontend Testing', category: 'testing', difficulty: 'intermediate', prerequisites: ['React Framework'] },
          { title: 'Web Performance & Optimization', category: 'performance', difficulty: 'advanced', prerequisites: ['React Framework', 'CSS Frameworks & Tailwind'] },
        ],
      },
      {
        domainSlug: 'ai-data-engineer',
        domainName: 'AI & Data Engineer',
        domainDescription: 'Master data pipelines, machine learning models, neural networks, and MLOps deployment.',
        roadmapTitle: 'AI & Data Engineering Roadmap',
        version: '1.0.0',
        nodes: [
          { title: 'Mathematics & Statistics', category: 'math', difficulty: 'beginner' },
          { title: 'Python Fundamentals', category: 'core', difficulty: 'beginner' },
          { title: 'Data Structures & Algorithms', category: 'core', difficulty: 'intermediate', prerequisites: ['Python Fundamentals'] },
          { title: 'Data Manipulation & Pandas', category: 'data', difficulty: 'intermediate', prerequisites: ['Python Fundamentals', 'Mathematics & Statistics'] },
          { title: 'SQL & Data Warehousing', category: 'database', difficulty: 'intermediate', prerequisites: ['Data Structures & Algorithms'] },
          { title: 'Machine Learning Fundamentals', category: 'ai', difficulty: 'intermediate', prerequisites: ['Data Manipulation & Pandas', 'Mathematics & Statistics'] },
          { title: 'Deep Learning & Neural Networks', category: 'ai', difficulty: 'advanced', prerequisites: ['Machine Learning Fundamentals'] },
          { title: 'Data Pipelines & ETL', category: 'data', difficulty: 'advanced', prerequisites: ['SQL & Data Warehousing', 'Data Manipulation & Pandas'] },
          { title: 'MLOps & Model Deployment', category: 'deployment', difficulty: 'advanced', prerequisites: ['Deep Learning & Neural Networks', 'Data Pipelines & ETL'] },
        ],
      },
    ];

    for (const rawData of initialDomains) {
      const payload = adapter.parseRoadmap(rawData);
      // Synchronous in-memory seed execution
      void this.importRoadmap(payload);
    }
  }
}

export const roadmapService = new RoadmapService();
