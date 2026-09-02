import { randomUUID } from 'crypto';
import {
  JobPostingDTO,
  CreateJobPostingInput,
  ExtractedSkillsResult,
} from './types.js';
import { jobExtractorService } from './jobExtractorService.js';
import { isSupabaseConfigured, getSupabaseClient } from '../common/supabase.js';

export class JobPostingService {
  private jobsMap = new Map<string, JobPostingDTO>();

  constructor() {
    this.seedInitialBenchmarkJobs();
  }

  /**
   * Parse a raw job description without creating a persistent record
   */
  public parseRawJobDescription(rawText: string, domainSlug?: string): ExtractedSkillsResult {
    return jobExtractorService.extractSkillsFromText(rawText, domainSlug);
  }

  /**
   * Create and persist a new structured Job Posting
   */
  public async createJobPosting(input: CreateJobPostingInput): Promise<JobPostingDTO> {
    const extracted = jobExtractorService.extractSkillsFromText(
      input.rawDescription,
      input.domainSlug
    );

    const now = new Date().toISOString();
    const id = randomUUID();

    const jobPosting: JobPostingDTO = {
      id,
      title: input.title.trim(),
      company: input.company.trim(),
      location: input.location?.trim() || 'Remote / Hybrid',
      employmentType: input.employmentType || 'full-time',
      experienceLevel: input.experienceLevel || 'mid',
      domainSlug: input.domainSlug || extracted.detectedDomainSlug,
      rawDescription: input.rawDescription.trim(),
      requiredSkills: extracted.requiredSkills,
      preferredSkills: extracted.preferredSkills,
      createdAt: now,
      updatedAt: now,
    };

    this.jobsMap.set(jobPosting.id, jobPosting);

    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseClient();
        await supabase.from('job_postings').upsert({
          id: jobPosting.id,
          title: jobPosting.title,
          company: jobPosting.company,
          location: jobPosting.location,
          employment_type: jobPosting.employmentType,
          experience_level: jobPosting.experienceLevel,
          domain_slug: jobPosting.domainSlug,
          raw_description: jobPosting.rawDescription,
          required_skills: jobPosting.requiredSkills,
          preferred_skills: jobPosting.preferredSkills,
          created_at: jobPosting.createdAt,
          updated_at: jobPosting.updatedAt,
        });
      } catch (err) {
        console.warn('[JobPostingService] Supabase sync deferred:', err);
      }
    }

    return jobPosting;
  }

  /**
   * Retrieve all available job postings
   */
  public async getAllJobPostings(): Promise<JobPostingDTO[]> {
    return Array.from(this.jobsMap.values());
  }

  /**
   * Retrieve a job posting by ID
   */
  public async getJobPostingById(id: string): Promise<JobPostingDTO | null> {
    return this.jobsMap.get(id) || null;
  }

  /**
   * Seed standard benchmark jobs for immediate testing and demo
   */
  private seedInitialBenchmarkJobs(): void {
    const benchmarkJobs: CreateJobPostingInput[] = [
      {
        title: 'Backend Systems & API Engineer',
        company: 'CloudScale Technologies',
        location: 'San Francisco, CA / Remote',
        employmentType: 'full-time',
        experienceLevel: 'mid',
        domainSlug: 'backend-developer',
        rawDescription: `
About the Role:
CloudScale is looking for a Backend Engineer to build scalable microservices and robust API systems.

Requirements:
- Strong experience designing and implementing RESTful APIs with JSON endpoints.
- Deep hands-on knowledge of Relational Databases (PostgreSQL, SQL queries, indexing, transactions).
- Proven track record implementing Authentication & Security patterns including OAuth2, JWTs, and CORS.
- Solid understanding of Internet Basics, HTTP/HTTPS lifecycle, and networking protocols.
- Proficiency with Docker & Containerization for containerized microservice deployments.

Nice to Have:
- Experience with Caching & Redis for high-throughput distributed caching.
- Familiarity with Microservices Architecture, gRPC, or message-driven systems.
        `,
      },
      {
        title: 'Frontend React & UI Engineer',
        company: 'Apex FinTech Global',
        location: 'New York, NY / Remote',
        employmentType: 'full-time',
        experienceLevel: 'mid',
        domainSlug: 'frontend-developer',
        rawDescription: `
About the Role:
Apex FinTech is hiring a Frontend Engineer to develop high-performance financial analytics dashboards.

Requirements:
- 3+ years of hands-on experience with modern JavaScript ES6+, TypeScript, and asynchronous patterns.
- Deep expertise in React Fundamentals (hooks, JSX, state management, modular components).
- Expert mastery of HTML5 & Semantic Markup and web accessibility (a11y).
- Strong command of CSS & Tailwind CSS for modern responsive interfaces and design systems.

Nice to Have:
- Experience with Frontend Performance & SEO optimization (bundle size reduction, Core Web Vitals, SSR).
        `,
      },
      {
        title: 'AI & Data Platforms Engineer',
        company: 'DataVanguard Labs',
        location: 'Seattle, WA / Remote',
        employmentType: 'full-time',
        experienceLevel: 'senior',
        domainSlug: 'ai-data-engineer',
        rawDescription: `
About the Role:
DataVanguard Labs is seeking an AI & Data Engineer to build predictive models and GenAI-powered data pipelines.

Requirements:
- Advanced proficiency in Python for AI (NumPy, Pandas, scientific computing).
- Strong track record building Data Pipelines & Advanced SQL transformations with large-scale data warehouses.
- Solid grounding in Machine Learning Foundations (supervised learning, regression, classification, evaluation metrics).
- Deep experience in Deep Learning & PyTorch for training and fine-tuning neural architectures.

Nice to Have:
- Hands-on experience with LLMs & Prompt Engineering (RAG architectures, vector embeddings, LangChain).
- Understanding of MLOps & Model Deployment (containerized inference, model monitoring, FastAPI).
        `,
      },
    ];

    for (const job of benchmarkJobs) {
      const extracted = jobExtractorService.extractSkillsFromText(
        job.rawDescription,
        job.domainSlug
      );
      const id = `bench-${job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      const now = new Date().toISOString();

      const posting: JobPostingDTO = {
        id,
        title: job.title,
        company: job.company,
        location: job.location || 'Remote',
        employmentType: job.employmentType || 'full-time',
        experienceLevel: job.experienceLevel || 'mid',
        domainSlug: job.domainSlug || extracted.detectedDomainSlug,
        rawDescription: job.rawDescription.trim(),
        requiredSkills: extracted.requiredSkills,
        preferredSkills: extracted.preferredSkills,
        createdAt: now,
        updatedAt: now,
      };

      this.jobsMap.set(posting.id, posting);
    }
  }
}

export const jobPostingService = new JobPostingService();
