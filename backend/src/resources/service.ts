import { randomUUID } from 'crypto';
import { ResourceDTO } from './types.js';

export class ResourceService {
  private resources: ResourceDTO[] = [
    // Backend Skills
    {
      id: 'res-internet-1',
      skillSlug: 'internet-basics',
      title: 'How the Web Works — MDN Web Docs',
      url: 'https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/How_does_the_Internet_work',
      type: 'documentation',
      source: 'MDN',
      description: 'Comprehensive overview of IP addresses, DNS, HTTP protocols, and server-client architecture.',
      isFree: true,
    },
    {
      id: 'res-internet-2',
      skillSlug: 'internet-basics',
      title: 'Networking Essentials Guide',
      url: 'https://roadmap.sh/guides/what-is-internet',
      type: 'tutorial',
      source: 'roadmap.sh',
      description: 'Visual breakdown of TCP/IP, OSI model, domain routing, and packet transfer.',
      isFree: true,
    },
    {
      id: 'res-os-1',
      skillSlug: 'operating-systems-cli',
      title: 'Linux Command Line Fundamentals',
      url: 'https://ubuntu.com/tutorials/command-line-for-beginners',
      type: 'tutorial',
      source: 'Ubuntu Tutorials',
      description: 'Practical guide to navigation, file permissions, pipes, processes, and bash scripting.',
      isFree: true,
    },
    {
      id: 'res-prog-1',
      skillSlug: 'programming-languages',
      title: 'Modern TypeScript & Node.js Handbook',
      url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
      type: 'documentation',
      source: 'TypeScript Official',
      description: 'Core syntax, type systems, async programming, and enterprise patterns.',
      isFree: true,
    },
    {
      id: 'res-db-1',
      skillSlug: 'relational-databases',
      title: 'PostgreSQL Architecture & SQL Tutorial',
      url: 'https://www.postgresql.org/docs/current/tutorial.html',
      type: 'documentation',
      source: 'PostgreSQL.org',
      description: 'Relational data modeling, ACID transactions, foreign keys, indexing, and query optimization.',
      isFree: true,
    },
    {
      id: 'res-git-1',
      skillSlug: 'version-control',
      title: 'Pro Git Book (Free Edition)',
      url: 'https://git-scm.com/book/en/v2',
      type: 'documentation',
      source: 'Git SCM',
      description: 'Branching models, merge conflict resolution, rebasing, remotes, and pull request workflows.',
      isFree: true,
    },
    {
      id: 'res-rest-1',
      skillSlug: 'rest-apis',
      title: 'RESTful API Design Best Practices',
      url: 'https://restfulapi.net/',
      type: 'article',
      source: 'RESTfulAPI.net',
      description: 'Resource naming, HTTP status codes, idempotency, pagination, and payload structures.',
      isFree: true,
    },
    {
      id: 'res-auth-1',
      skillSlug: 'authentication-security',
      title: 'OWASP API Security Top 10',
      url: 'https://owasp.org/www-project-api-security/',
      type: 'documentation',
      source: 'OWASP',
      description: 'JWT validation, OAuth 2.0 flows, RBAC authorization, and token storage safeguards.',
      isFree: true,
    },
    {
      id: 'res-cache-1',
      skillSlug: 'caching-performance',
      title: 'Redis In-Memory Data Storage Architecture',
      url: 'https://redis.io/docs/about/',
      type: 'documentation',
      source: 'Redis.io',
      description: 'Cache eviction strategies, TTL configuration, distributed locking, and cache invalidation.',
      isFree: true,
    },
    {
      id: 'res-sys-1',
      skillSlug: 'system-design-microservices',
      title: 'System Design Primer',
      url: 'https://github.com/donnemartin/system-design-primer',
      type: 'article',
      source: 'GitHub Open Source',
      description: 'Scalability, load balancing, horizontal partitioning, microservice communication, and resilience.',
      isFree: true,
    },

    // Frontend Skills
    {
      id: 'res-html-1',
      skillSlug: 'html-css',
      title: 'HTML & CSS Developer Guide',
      url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML',
      type: 'documentation',
      source: 'MDN Web Docs',
      description: 'Semantic HTML5 structures, CSS Flexbox, Grid layouts, and responsive media queries.',
      isFree: true,
    },
    {
      id: 'res-js-1',
      skillSlug: 'javascript-fundamentals',
      title: 'The Modern JavaScript Tutorial',
      url: 'https://javascript.info/',
      type: 'tutorial',
      source: 'JavaScript.info',
      description: 'Closures, prototypes, event loop, Promises, DOM manipulation, and ES6+ modules.',
      isFree: true,
    },
    {
      id: 'res-react-1',
      skillSlug: 'react-framework',
      title: 'React Documentation (react.dev)',
      url: 'https://react.dev/learn',
      type: 'documentation',
      source: 'React Official',
      description: 'Component lifecycles, hooks (useState, useEffect, useMemo), props drilling, and composition.',
      isFree: true,
    },

    // AI & Data Skills
    {
      id: 'res-math-1',
      skillSlug: 'mathematics-statistics',
      title: 'Mathematics for Machine Learning',
      url: 'https://mml-book.github.io/',
      type: 'article',
      source: 'Cambridge University Press',
      description: 'Linear algebra, vector calculus, probability distributions, and gradient descent mechanics.',
      isFree: true,
    },
    {
      id: 'res-py-1',
      skillSlug: 'python-fundamentals',
      title: 'Official Python Tutorial',
      url: 'https://docs.python.org/3/tutorial/',
      type: 'documentation',
      source: 'Python.org',
      description: 'Data structures, list comprehensions, OOP in Python, generators, and package management.',
      isFree: true,
    },
  ];

  /**
   * Get learning resources for a skill slug
   */
  public async getResourcesForSkill(skillSlug: string): Promise<ResourceDTO[]> {
    const slug = skillSlug.trim().toLowerCase();
    const matched = this.resources.filter((r) => r.skillSlug === slug);

    if (matched.length > 0) {
      return matched;
    }

    // Dynamic fallback resource if specific curated items are not pre-indexed
    return [
      {
        id: randomUUID(),
        skillSlug: slug,
        title: `${slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Learning Guide`,
        url: `https://roadmap.sh`,
        type: 'documentation',
        source: 'roadmap.sh / Community Docs',
        description: `Curated learning guides and references for mastering ${slug.replace(/-/g, ' ')}.`,
        isFree: true,
      },
    ];
  }
}

export const resourceService = new ResourceService();
