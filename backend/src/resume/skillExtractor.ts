import {
  ResumeExtractionResultDTO,
  ExtractedSkillClaimDTO,
  ResumeSkillExtractionResponseDTO,
} from './types.js';
import { ResumeExtractor } from './resumeExtractor.js';

interface TaxonomySkillDefinition {
  skillId: string;
  skillName: string;
  category: string;
  domainSlug: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  aliases: string[];
}

export class ResumeSkillExtractor {
  // Canonical skill taxonomy with comprehensive real-world aliases
  private static readonly TAXONOMY: TaxonomySkillDefinition[] = [
    // Backend Developer
    {
      skillId: 's1',
      skillName: 'Node.js Architecture',
      category: 'Backend Core',
      domainSlug: 'backend-developer',
      difficulty: 'intermediate',
      aliases: ['node', 'nodejs', 'node.js', 'express', 'express.js', 'expressjs', 'nestjs', 'nest.js', 'backend node'],
    },
    {
      skillId: 's2',
      skillName: 'PostgreSQL Indexing',
      category: 'Databases',
      domainSlug: 'backend-developer',
      difficulty: 'advanced',
      aliases: ['postgres', 'postgresql', 'psql', 'postgres indexing', 'sql optimization', 'relational database', 'rdbms'],
    },
    {
      skillId: 's3',
      skillName: 'REST API Security',
      category: 'Security',
      domainSlug: 'backend-developer',
      difficulty: 'advanced',
      aliases: ['rest api security', 'api security', 'jwt', 'oauth', 'oauth2', 'cors', 'csrf', 'api authorization'],
    },
    {
      skillId: 's4',
      skillName: 'Redis Caching',
      category: 'Databases',
      domainSlug: 'backend-developer',
      difficulty: 'intermediate',
      aliases: ['redis', 'caching', 'distributed cache', 'in-memory cache', 'redis cluster'],
    },
    {
      skillId: 's5',
      skillName: 'Docker Containerization',
      category: 'DevOps',
      domainSlug: 'backend-developer',
      difficulty: 'intermediate',
      aliases: ['docker', 'containerization', 'containers', 'dockerfile', 'docker compose', 'k8s', 'kubernetes'],
    },
    {
      skillId: 's14',
      skillName: 'Authentication & JWT',
      category: 'Security',
      domainSlug: 'backend-developer',
      difficulty: 'intermediate',
      aliases: ['authentication', 'jwt', 'session auth', 'rbac', 'identity management', 'access control'],
    },

    // Frontend Developer
    {
      skillId: 's10',
      skillName: 'React State Management',
      category: 'Frontend Core',
      domainSlug: 'frontend-developer',
      difficulty: 'intermediate',
      aliases: ['react', 'reactjs', 'react.js', 'redux', 'redux toolkit', 'zustand', 'react hooks', 'context api'],
    },
    {
      skillId: 's11',
      skillName: 'TypeScript Strict Patterns',
      category: 'Languages',
      domainSlug: 'frontend-developer',
      difficulty: 'intermediate',
      aliases: ['typescript', 'ts', 'typed javascript', 'strict typescript'],
    },
    {
      skillId: 's12',
      skillName: 'Web Performance Optimization',
      category: 'Performance',
      domainSlug: 'frontend-developer',
      difficulty: 'advanced',
      aliases: ['web performance', 'lighthouse', 'core web vitals', 'lazy loading', 'bundle optimization', 'code splitting', 'tree shaking'],
    },
    {
      skillId: 's13',
      skillName: 'Tailwind CSS Design Systems',
      category: 'UI/UX',
      domainSlug: 'frontend-developer',
      difficulty: 'beginner',
      aliases: ['tailwind', 'tailwindcss', 'tailwind css', 'css modules', 'responsive design', 'utility css'],
    },

    // AI & Data Engineer
    {
      skillId: 's6',
      skillName: 'Python for Data Science',
      category: 'Core Languages',
      domainSlug: 'ai-data-engineer',
      difficulty: 'beginner',
      aliases: ['python', 'python3', 'pandas', 'numpy', 'scipy', 'jupyter'],
    },
    {
      skillId: 's7',
      skillName: 'PyTorch Deep Learning',
      category: 'Machine Learning',
      domainSlug: 'ai-data-engineer',
      difficulty: 'advanced',
      aliases: ['pytorch', 'torch', 'deep learning', 'neural networks', 'cnn', 'rnn', 'transformers', 'tensorflow', 'keras'],
    },
    {
      skillId: 's8',
      skillName: 'Data Pipeline Engineering',
      category: 'Data Ops',
      domainSlug: 'ai-data-engineer',
      difficulty: 'advanced',
      aliases: ['data pipelines', 'etl', 'elt', 'airflow', 'spark', 'kafka', 'data engineering'],
    },
    {
      skillId: 's9',
      skillName: 'Vector Embeddings',
      category: 'AI Architecture',
      domainSlug: 'ai-data-engineer',
      difficulty: 'advanced',
      aliases: ['vector embeddings', 'embeddings', 'vector database', 'pinecone', 'chroma', 'chromadb', 'rag', 'llm', 'langchain'],
    },
  ];

  /**
   * Main entry point: extracts and maps skills from a parsed resume extraction result.
   */
  public static extractSkillsFromResume(
    extractionResult: ResumeExtractionResultDTO,
    userId?: string
  ): ResumeSkillExtractionResponseDTO {
    const claimsMap = new Map<string, ExtractedSkillClaimDTO>();
    const unmappedKeywords = new Set<string>();

    const { rawSkillsText, experience, projects, education } = extractionResult.sections;

    // 1. First Pass: Explicit skills tokens
    rawSkillsText.forEach((rawToken) => {
      const match = this.matchTokenToTaxonomy(rawToken);
      if (match) {
        claimsMap.set(match.skill.skillId, {
          skillId: match.skill.skillId,
          skillName: match.skill.skillName,
          category: match.skill.category,
          domainSlug: match.skill.domainSlug,
          difficulty: match.skill.difficulty,
          status: 'UNVERIFIED',
          verificationScore: null,
          matchType: match.matchType,
          extractedFrom: 'skills_section',
          mentionContext: `Listed in skills section as "${rawToken}"`,
          confidence: match.confidence,
        });
      } else {
        if (rawToken.length > 1 && rawToken.length < 35 && !rawToken.includes(':')) {
          unmappedKeywords.add(rawToken);
        }
      }
    });

    // 2. Second Pass: Experience section scanning
    experience.forEach((exp) => {
      const roleAndBullets = `${exp.role} ${exp.bullets.join(' ')}`;
      this.scanTextForTaxonomySkills(roleAndBullets, 'experience', exp.company, claimsMap);
    });

    // 3. Third Pass: Projects section scanning
    projects.forEach((proj) => {
      const projText = `${proj.title} ${proj.technologies.join(' ')} ${proj.description}`;
      this.scanTextForTaxonomySkills(projText, 'projects', proj.title, claimsMap);
    });

    // 4. Fourth Pass: Education section scanning
    education.forEach((edu) => {
      const eduText = `${edu.degree || ''} ${edu.fieldOfStudy || ''}`;
      if (eduText.trim().length > 0) {
        this.scanTextForTaxonomySkills(eduText, 'education', edu.institution, claimsMap);
      }
    });

    const matchedTaxonomySkills = Array.from(claimsMap.values()).sort(
      (a, b) => b.confidence - a.confidence
    );

    const recommendedAssessmentSkillIds = matchedTaxonomySkills
      .slice(0, 5)
      .map((c) => c.skillId);

    return {
      success: true,
      totalClaimsFound: matchedTaxonomySkills.length,
      matchedTaxonomySkills,
      unmappedKeywords: Array.from(unmappedKeywords),
      candidateProfileUpdate: {
        userId,
        totalUnverifiedClaims: matchedTaxonomySkills.length,
        recommendedAssessmentSkillIds,
      },
      invariantNotice:
        'CRITICAL INVARIANT: All resume-extracted skills are stored strictly as UNVERIFIED self-claims. They do NOT grant verification badges, contribute to verified readiness scores, or affect leaderboard ranking without a passing proctored score (>= 80%).',
      extractedAt: new Date().toISOString(),
    };
  }

  /**
   * Convenience method: runs text extraction and skill extraction end-to-end from raw text.
   */
  public static extractSkillsFromRawText(
    rawText: string,
    userId?: string
  ): ResumeSkillExtractionResponseDTO {
    const extractionResult = ResumeExtractor.processResume({ rawText, mimeType: 'text/plain' });
    return this.extractSkillsFromResume(extractionResult, userId);
  }

  /**
   * Helper: Matches an individual token to the taxonomy using exact and alias comparisons.
   */
  private static matchTokenToTaxonomy(
    token: string
  ): { skill: TaxonomySkillDefinition; matchType: 'exact' | 'alias'; confidence: number } | null {
    const clean = token.trim().toLowerCase();
    if (!clean) return null;

    for (const skill of this.TAXONOMY) {
      // Exact skill name match
      if (skill.skillName.toLowerCase() === clean) {
        return { skill, matchType: 'exact', confidence: 1.0 };
      }

      // Alias match
      for (const alias of skill.aliases) {
        if (alias.toLowerCase() === clean) {
          return { skill, matchType: 'alias', confidence: 0.95 };
        }
      }
    }

    return null;
  }

  /**
   * Helper: Scans a block of text (e.g. experience bullet) for taxonomy keywords.
   */
  private static scanTextForTaxonomySkills(
    text: string,
    extractedFrom: 'experience' | 'projects' | 'education',
    contextName: string,
    claimsMap: Map<string, ExtractedSkillClaimDTO>
  ): void {
    const lower = text.toLowerCase();

    for (const skill of this.TAXONOMY) {
      // Check if already claimed with higher confidence
      if (claimsMap.has(skill.skillId) && claimsMap.get(skill.skillId)?.extractedFrom === 'skills_section') {
        continue;
      }

      // Check aliases in text with word boundary
      for (const alias of skill.aliases) {
        const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordRegex = new RegExp(`\\b${escaped}\\b`, 'i');

        if (wordRegex.test(lower)) {
          // If already in map from another experience bullet, keep highest confidence
          if (!claimsMap.has(skill.skillId)) {
            claimsMap.set(skill.skillId, {
              skillId: skill.skillId,
              skillName: skill.skillName,
              category: skill.category,
              domainSlug: skill.domainSlug,
              difficulty: skill.difficulty,
              status: 'UNVERIFIED',
              verificationScore: null,
              matchType: 'contextual',
              extractedFrom,
              mentionContext: `Mentioned in ${extractedFrom} under ${contextName}`,
              confidence: 0.85,
            });
          }
          break;
        }
      }
    }
  }
}
