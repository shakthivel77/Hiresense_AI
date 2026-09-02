import { randomUUID } from 'crypto';
import {
  JobSkillRequirementDTO,
  ExtractedSkillsResult,
  SkillRequirementImportance,
} from './types.js';
import { roadmapService } from '../roadmap/service.js';

interface SkillKeywordMap {
  skillId: string;
  skillName: string;
  category: string;
  domainSlug: string;
  keywords: string[];
}

export class JobExtractorService {
  private skillKeywordDictionary: SkillKeywordMap[] = [
    // Backend Skills
    {
      skillId: 'internet-basics',
      skillName: 'Internet Basics',
      category: 'fundamentals',
      domainSlug: 'backend-developer',
      keywords: ['internet', 'http', 'https', 'dns', 'tcp/ip', 'networking', 'browser protocols'],
    },
    {
      skillId: 'restful-apis',
      skillName: 'RESTful APIs',
      category: 'core',
      domainSlug: 'backend-developer',
      keywords: ['rest', 'restful', 'api', 'apis', 'rest api', 'endpoints', 'json api', 'http api'],
    },
    {
      skillId: 'relational-databases',
      skillName: 'Relational Databases',
      category: 'core',
      domainSlug: 'backend-developer',
      keywords: ['sql', 'postgresql', 'postgres', 'mysql', 'relational database', 'rdbms', 'sqlite', 'database design', 'acid'],
    },
    {
      skillId: 'authentication-security',
      skillName: 'Authentication & Security',
      category: 'core',
      domainSlug: 'backend-developer',
      keywords: ['auth', 'authentication', 'jwt', 'oauth', 'oauth2', 'security', 'cors', 'csrf', 'bcrypt', 'sso', 'authorization', 'rbac'],
    },
    {
      skillId: 'caching-redis',
      skillName: 'Caching & Redis',
      category: 'advanced',
      domainSlug: 'backend-developer',
      keywords: ['caching', 'redis', 'memcached', 'cache', 'in-memory cache', 'distributed caching'],
    },
    {
      skillId: 'docker-containerization',
      skillName: 'Docker & Containerization',
      category: 'tools',
      domainSlug: 'backend-developer',
      keywords: ['docker', 'container', 'containers', 'containerization', 'docker compose', 'kubernetes', 'k8s', 'helm', 'dockerfile'],
    },
    {
      skillId: 'microservices-architecture',
      skillName: 'Microservices Architecture',
      category: 'advanced',
      domainSlug: 'backend-developer',
      keywords: ['microservices', 'distributed systems', 'service-oriented', 'grpc', 'message queue', 'kafka', 'rabbitmq', 'event-driven'],
    },

    // Frontend Skills
    {
      skillId: 'html5-semantic-markup',
      skillName: 'HTML5 & Semantic Markup',
      category: 'fundamentals',
      domainSlug: 'frontend-developer',
      keywords: ['html', 'html5', 'semantic html', 'web accessibility', 'a11y', 'dom', 'markup'],
    },
    {
      skillId: 'css-tailwind',
      skillName: 'CSS & Tailwind',
      category: 'fundamentals',
      domainSlug: 'frontend-developer',
      keywords: ['css', 'css3', 'tailwind', 'tailwindcss', 'flexbox', 'grid', 'responsive design', 'sass', 'scss', 'styled-components'],
    },
    {
      skillId: 'javascript-es6',
      skillName: 'JavaScript ES6+',
      category: 'core',
      domainSlug: 'frontend-developer',
      keywords: ['javascript', 'js', 'es6', 'es2020', 'typescript', 'ts', 'ecmascript', 'async/await', 'promises', 'vanilla js'],
    },
    {
      skillId: 'react-fundamentals',
      skillName: 'React Fundamentals',
      category: 'core',
      domainSlug: 'frontend-developer',
      keywords: ['react', 'react.js', 'reactjs', 'react hooks', 'jsx', 'next.js', 'nextjs', 'redux', 'state management', 'vue', 'frontend framework'],
    },
    {
      skillId: 'frontend-performance',
      skillName: 'Frontend Performance & SEO',
      category: 'advanced',
      domainSlug: 'frontend-developer',
      keywords: ['web performance', 'lighthouse', 'lazy loading', 'bundle size', 'core web vitals', 'seo', 'code splitting', 'ssr', 'webpack', 'vite'],
    },

    // AI & Data Engineer Skills
    {
      skillId: 'python-for-ai',
      skillName: 'Python for AI',
      category: 'fundamentals',
      domainSlug: 'ai-data-engineer',
      keywords: ['python', 'python3', 'numpy', 'pandas', 'scipy', 'matplotlib', 'seaborn', 'jupyter'],
    },
    {
      skillId: 'data-pipelines-sql',
      skillName: 'Data Pipelines & Advanced SQL',
      category: 'core',
      domainSlug: 'ai-data-engineer',
      keywords: ['etl', 'elt', 'data pipeline', 'data pipelines', 'data engineering', 'bigquery', 'snowflake', 'apache spark', 'spark', 'airflow', 'data warehouse'],
    },
    {
      skillId: 'machine-learning-foundations',
      skillName: 'Machine Learning Foundations',
      category: 'core',
      domainSlug: 'ai-data-engineer',
      keywords: ['machine learning', 'ml', 'scikit-learn', 'regression', 'classification', 'clustering', 'supervised learning', 'unsupervised learning', 'cross-validation'],
    },
    {
      skillId: 'deep-learning-pytorch',
      skillName: 'Deep Learning & PyTorch',
      category: 'advanced',
      domainSlug: 'ai-data-engineer',
      keywords: ['deep learning', 'pytorch', 'tensorflow', 'keras', 'neural networks', 'cnn', 'rnn', 'transformers', 'gpu acceleration', 'cuda'],
    },
    {
      skillId: 'llms-prompt-engineering',
      skillName: 'LLMs & Prompt Engineering',
      category: 'advanced',
      domainSlug: 'ai-data-engineer',
      keywords: ['llm', 'llms', 'large language models', 'prompt engineering', 'langchain', 'rag', 'vector database', 'embeddings', 'pinecone', 'chroma', 'gemini', 'openai'],
    },
    {
      skillId: 'mlops-deployment',
      skillName: 'MLOps & Model Deployment',
      category: 'tools',
      domainSlug: 'ai-data-engineer',
      keywords: ['mlops', 'model deployment', 'fastapi', 'triton', 'torchserve', 'mlflow', 'wandb', 'model monitoring', 'huggingface'],
    },
  ];

  /**
   * Parse raw text and extract structured required and preferred skills
   */
  public extractSkillsFromText(rawText: string, fallbackDomainSlug?: string): ExtractedSkillsResult {
    const textLower = rawText.toLowerCase();

    // Section boundary regexes
    const requiredHeadingRegex = /(?:requirements?|qualifications?|must[\s-]have|what you need|what you'll bring|who you are|technical skills|required skills|what we look for):?/i;
    const preferredHeadingRegex = /(?:nice[\s-]to[\s-]have|preferred|bonus|pluses?|good[\s-]to[\s-]have|desired|optional|extra points):?/i;

    const lines = rawText.split(/\r?\n/);
    let currentMode: SkillRequirementImportance = 'REQUIRED';

    const requiredTextChunks: string[] = [];
    const preferredTextChunks: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (preferredHeadingRegex.test(trimmed)) {
        currentMode = 'PREFERRED';
        continue;
      } else if (requiredHeadingRegex.test(trimmed)) {
        currentMode = 'REQUIRED';
        continue;
      }

      if (currentMode === 'REQUIRED') {
        requiredTextChunks.push(trimmed);
      } else {
        preferredTextChunks.push(trimmed);
      }
    }

    const requiredText = requiredTextChunks.join(' ').toLowerCase();
    const preferredText = preferredTextChunks.join(' ').toLowerCase();

    const requiredSkillsMap = new Map<string, JobSkillRequirementDTO>();
    const preferredSkillsMap = new Map<string, JobSkillRequirementDTO>();

    const domainVoteCount: Record<string, number> = {
      'backend-developer': 0,
      'frontend-developer': 0,
      'ai-data-engineer': 0,
    };

    for (const skillDef of this.skillKeywordDictionary) {
      let matchedInRequired = false;
      let matchedInPreferred = false;

      for (const kw of skillDef.keywords) {
        // Regex word boundary matching
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?:^|\\b|\\s)${escaped}(?:\\b|\\s|$)`, 'i');

        if (!matchedInRequired && regex.test(requiredText)) {
          matchedInRequired = true;
          domainVoteCount[skillDef.domainSlug] = (domainVoteCount[skillDef.domainSlug] || 0) + 2;
        }

        if (!matchedInPreferred && regex.test(preferredText)) {
          matchedInPreferred = true;
          domainVoteCount[skillDef.domainSlug] = (domainVoteCount[skillDef.domainSlug] || 0) + 1;
        }

        // Global fallback if no headers were found
        if (!matchedInRequired && !matchedInPreferred && regex.test(textLower)) {
          matchedInRequired = true;
          domainVoteCount[skillDef.domainSlug] = (domainVoteCount[skillDef.domainSlug] || 0) + 1;
        }
      }

      if (matchedInRequired) {
        requiredSkillsMap.set(skillDef.skillId, {
          id: randomUUID(),
          skillId: skillDef.skillId,
          skillName: skillDef.skillName,
          category: skillDef.category,
          importance: 'REQUIRED',
          weight: 1.0,
          minProficiency: 80,
        });
      } else if (matchedInPreferred) {
        preferredSkillsMap.set(skillDef.skillId, {
          id: randomUUID(),
          skillId: skillDef.skillId,
          skillName: skillDef.skillName,
          category: skillDef.category,
          importance: 'PREFERRED',
          weight: 0.5,
          minProficiency: 80,
        });
      }
    }

    // Determine winning domain
    let detectedDomainSlug = fallbackDomainSlug || 'backend-developer';
    let maxVotes = 0;
    for (const [dSlug, votes] of Object.entries(domainVoteCount)) {
      if (votes > maxVotes) {
        maxVotes = votes;
        detectedDomainSlug = dSlug;
      }
    }

    return {
      requiredSkills: Array.from(requiredSkillsMap.values()),
      preferredSkills: Array.from(preferredSkillsMap.values()),
      detectedDomainSlug,
    };
  }
}

export const jobExtractorService = new JobExtractorService();
