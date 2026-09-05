import {
  InterviewQuestionDTO,
  InterviewQuestionQuery,
  SelectInterviewQuestionsParams,
} from './types.js';

export class InterviewQuestionBankService {
  private questionsMap = new Map<string, InterviewQuestionDTO>();

  constructor() {
    this.seedBaselineInterviewQuestions();
  }

  /**
   * Retrieve all available interview questions
   */
  public async getAllQuestions(): Promise<InterviewQuestionDTO[]> {
    return Array.from(this.questionsMap.values());
  }

  /**
   * Retrieve a single interview question by ID
   */
  public async getQuestionById(id: string): Promise<InterviewQuestionDTO | null> {
    return this.questionsMap.get(id) || null;
  }

  /**
   * Query interview questions with filters
   */
  public async getQuestions(query: InterviewQuestionQuery): Promise<InterviewQuestionDTO[]> {
    let list = Array.from(this.questionsMap.values());

    if (query.domainSlug) {
      list = list.filter(
        (q) => q.domainSlug === query.domainSlug || q.domainSlug === 'general'
      );
    }
    if (query.type) {
      list = list.filter((q) => q.type === query.type);
    }
    if (query.difficulty) {
      list = list.filter((q) => q.difficulty === query.difficulty);
    }
    if (query.skillId) {
      list = list.filter((q) => q.skillId === query.skillId);
    }

    return list;
  }

  /**
   * Select a balanced question set for a timed mock interview session
   */
  public async selectQuestionsForInterview(
    params: SelectInterviewQuestionsParams
  ): Promise<InterviewQuestionDTO[]> {
    const targetCount = params.questionCount || 4;
    const includeBehavioral = params.includeBehavioral ?? true;

    const domainQuestions = Array.from(this.questionsMap.values()).filter(
      (q) => q.domainSlug === params.domainSlug
    );

    const behavioralQuestions = Array.from(this.questionsMap.values()).filter(
      (q) => q.type === 'BEHAVIORAL'
    );

    const selected: InterviewQuestionDTO[] = [];

    // 1. Pick 1 behavioral opener if requested
    if (includeBehavioral && behavioralQuestions.length > 0) {
      const randomBehIndex = Math.floor(Math.random() * behavioralQuestions.length);
      selected.push(behavioralQuestions[randomBehIndex]);
    }

    // 2. Pick remaining technical questions (shuffled)
    const shuffledTech = [...domainQuestions].sort(() => Math.random() - 0.5);

    for (const q of shuffledTech) {
      if (selected.length >= targetCount) break;
      if (!selected.some((s) => s.id === q.id)) {
        selected.push(q);
      }
    }

    // Fallback if domain had fewer questions
    if (selected.length < targetCount) {
      const allOther = Array.from(this.questionsMap.values()).filter(
        (q) => !selected.some((s) => s.id === q.id)
      );
      for (const q of allOther) {
        if (selected.length >= targetCount) break;
        selected.push(q);
      }
    }

    return selected;
  }

  /**
   * Seed structured behavioral and technical interview questions with rubrics
   */
  private seedBaselineInterviewQuestions(): void {
    const seedList: InterviewQuestionDTO[] = [
      // ==========================================
      // BACKEND DEVELOPER QUESTIONS
      // ==========================================
      {
        id: 'iq-be-01',
        type: 'TECHNICAL_DEEP_DIVE',
        skillId: 'relational-databases',
        domainSlug: 'backend-developer',
        title: 'PostgreSQL Indexing & Query Plan Optimization',
        prompt:
          'Imagine a high-traffic e-commerce order table with 50 million rows where a query filtering by customer_id, status, and created_at has started causing CPU spikes. Walk me through how you would diagnose the bottleneck using EXPLAIN ANALYZE and design an optimal B-Tree composite indexing strategy.',
        difficulty: 'intermediate',
        expectedTimeSeconds: 180,
        rubric: {
          keySignals: [
            'Mentions EXPLAIN (ANALYZE, BUFFERS) to inspect sequential scans vs index scans',
            'Identifies the index column order rule (equality first, range queries last)',
            'Discusses partial indexes for specific hot states (e.g. status = PENDING)',
            'Considers write amplification overhead on high-frequency tables',
          ],
          antiPatterns: [
            'Creating individual single-column indexes on all 3 columns expecting optimal intersection',
            'Placing the range column (created_at) ahead of equality columns in composite index',
            'Ignoring write performance penalties or table bloat',
          ],
          idealAnswerOutline: [
            '1. Diagnosis: Run EXPLAIN (ANALYZE, BUFFERS) to verify execution plan, rows scanned, and cache hits vs disk reads.',
            '2. Composite Index Design: (customer_id, status, created_at) applying the Equality-Range-Sort heuristic.',
            '3. Optimization alternatives: Covering indexes with INCLUDE clause to avoid heap fetches.',
            '4. Maintenance: Assessing index creation concurrency (CREATE INDEX CONCURRENTLY).',
          ],
          sampleFollowUpQuestions: [
            'What is the difference between a Bitmap Index Scan and an Index Scan in Postgres?',
            'How would your indexing strategy change if the table is partitioned by year or region?',
          ],
        },
        tags: ['sql', 'postgres', 'indexing', 'performance', 'database'],
      },
      {
        id: 'iq-be-02',
        type: 'TECHNICAL_DEEP_DIVE',
        skillId: 'restful-apis',
        domainSlug: 'backend-developer',
        title: 'Designing Idempotent APIs for Financial Transactions',
        prompt:
          'When designing a payment processing or billing endpoint (POST /api/v1/payments), network timeouts or client retries can cause duplicate charges. How do you design an idempotent payment API and handle concurrent duplicate requests at scale?',
        difficulty: 'intermediate',
        expectedTimeSeconds: 150,
        rubric: {
          keySignals: [
            'Introduces client-generated Idempotency-Key headers',
            'Explains atomic check-and-set database transactions or distributed locks (Redis Redlock)',
            'Describes storing the original response payload to return for duplicate retries',
            'Handles in-flight duplicate requests with 409 Conflict or locking status',
          ],
          antiPatterns: [
            'Relying purely on HTTP GET/PUT semantics without solving POST duplicate retries',
            'Storing idempotency keys without expiration (TTL)',
            'Processing the charge first and checking the database afterward',
          ],
          idealAnswerOutline: [
            '1. Header Contract: Client passes unique Idempotency-Key (UUIDv4) in HTTP header.',
            '2. Storage Layer: Atomic lock/record in Redis or Postgres with (user_id, idempotency_key, status, response_body, expires_at).',
            '3. State Machine: IN_PROGRESS -> COMPLETED / FAILED.',
            '4. Replay Response: Returning cached HTTP 200/201 with identical payload on retries.',
          ],
          sampleFollowUpQuestions: [
            'What HTTP status code should you return if a second request arrives while the first is still processing?',
            'How do you manage key TTL and cleanup in high-throughput environments?',
          ],
        },
        tags: ['api-design', 'idempotency', 'distributed-systems', 'rest', 'payments'],
      },
      {
        id: 'iq-be-03',
        type: 'TECHNICAL_DEEP_DIVE',
        skillId: 'authentication-security',
        domainSlug: 'backend-developer',
        title: 'Stateless JWT Authentication vs Server-Side Revocation',
        prompt:
          'Stateless JWT tokens are popular for scalable authentication, but they present challenges when you need to immediately revoke a compromised user session or handle password resets. Compare stateless JWTs against server-side session stores, and explain how you would implement secure token invalidation.',
        difficulty: 'intermediate',
        expectedTimeSeconds: 150,
        rubric: {
          keySignals: [
            'Differentiates access token (short TTL) vs refresh token (longer TTL, stored in DB/Redis)',
            'Discusses token blacklisting / denylist in Redis with access token expiration TTL',
            'Explains token rotation on refresh token usage to detect reuse/theft',
            'Mentions storing token version / password_changed_at timestamp on user record',
          ],
          antiPatterns: [
            'Claiming JWTs can be revoked instantly without any server-side state or store',
            'Setting multi-week expiry on access tokens stored in localStorage',
            'Storing sensitive secret keys inside the JWT payload without encryption',
          ],
          idealAnswerOutline: [
            '1. Architecture: Short-lived JWT access tokens (5-15 mins) + rotated refresh tokens in HttpOnly Secure cookies.',
            '2. Revocation Strategy 1: Instant blocklist in Redis keyed by JTI (JWT ID) matching remaining TTL.',
            '3. Revocation Strategy 2: User token_version counter verified in lightweight cache.',
            '4. Security posture: Mitigating XSS via HttpOnly cookies and CSRF with SameSite headers.',
          ],
          sampleFollowUpQuestions: [
            'Where should refresh tokens be securely stored on a modern web client?',
            'What happens if an attacker attempts to reuse an old rotated refresh token?',
          ],
        },
        tags: ['auth', 'jwt', 'security', 'oauth', 'sessions'],
      },
      {
        id: 'iq-be-04',
        type: 'SYSTEM_DESIGN',
        skillId: 'caching-redis',
        domainSlug: 'backend-developer',
        title: 'Redis Distributed Caching & Cache Invalidation Strategies',
        prompt:
          'Design a caching architecture for a read-heavy social feed service. Walk me through your choice of cache topology (Cache-Aside, Write-Through, Write-Behind), cache eviction policies, and how you mitigate Cache Stampede (Thundering Herd) and Cache Penetration.',
        difficulty: 'advanced',
        expectedTimeSeconds: 180,
        rubric: {
          keySignals: [
            'Explains Cache-Aside pattern and write invalidation trade-offs',
            'Mitigates Cache Stampede using mutex locks (singleflight) or probabilistic early expiration (XFetch)',
            'Prevents Cache Penetration using Bloom filters or caching empty null results with short TTL',
            'Discusses Cache Breakdown & Cache Avalanche mitigation using randomized TTL jitter',
          ],
          antiPatterns: [
            'Forgetting TTL on cached entries leading to stale or unbounded memory growth',
            'Directly querying database synchronously for all cache misses under high concurrency',
            'Treating cache as a durable primary database without fallback replication',
          ],
          idealAnswerOutline: [
            '1. Pattern: Cache-Aside with Redis cluster for high availability.',
            '2. Invalidation: Event-driven eviction via Pub/Sub or transactional change data capture.',
            '3. Concurrency Protection: Distributed lock for key recalculation to avoid thundering herd.',
            '4. Resiliency: Circuit breakers on cache failures to prevent cascading database crashes.',
          ],
          sampleFollowUpQuestions: [
            'How would you choose between Redis Sentinel and Redis Cluster in production?',
            'What eviction policy (LRU vs LFU) would you configure in maxmemory-policy?',
          ],
        },
        tags: ['redis', 'caching', 'system-design', 'high-throughput', 'resilience'],
      },
      {
        id: 'iq-be-05',
        type: 'TECHNICAL_DEEP_DIVE',
        skillId: 'docker-containerization',
        domainSlug: 'backend-developer',
        title: 'Containerization Best Practices & Multi-Stage Docker Builds',
        prompt:
          'Why are multi-stage Docker builds recommended for Node.js and TypeScript production microservices? What specific Dockerfile practices optimize build cache layers, image size, and container security?',
        difficulty: 'beginner',
        expectedTimeSeconds: 120,
        rubric: {
          keySignals: [
            'Separates build stage (with devDependencies/tsc) from minimal production runtime (dist + prod deps only)',
            'Copies package.json and lockfile prior to application code to leverage Docker layer caching',
            'Runs as a non-root user (USER node) for container security hardening',
            'Uses minimal base images like node:alpine or distroless',
          ],
          antiPatterns: [
            'Shipping TypeScript compiler and dev tools inside the final production container',
            'Copying full source code before npm install, busting layer cache on every code edit',
            'Running container processes as root',
          ],
          idealAnswerOutline: [
            '1. Multi-Stage Pipeline: Stage 1 (Builder: dependencies + tsc) -> Stage 2 (Runner: alpine base + dist + node_modules --production).',
            '2. Layer Caching: COPY package*.json ./ followed by RUN npm ci before COPYing source code.',
            '3. Security: Utilizing .dockerignore, non-root user, and read-only root filesystems.',
            '4. Healthchecks: Defining container HEALTHCHECK probes.',
          ],
          sampleFollowUpQuestions: [
            'How does npm ci differ from npm install inside a CI/CD Docker build?',
            'How do you handle secrets during Docker build without leaking them in image history?',
          ],
        },
        tags: ['docker', 'devops', 'containers', 'security', 'builds'],
      },

      // ==========================================
      // FRONTEND DEVELOPER QUESTIONS
      // ==========================================
      {
        id: 'iq-fe-01',
        type: 'TECHNICAL_DEEP_DIVE',
        skillId: 'react-fundamentals',
        domainSlug: 'frontend-developer',
        title: 'React Rendering Optimization & Hook Memory Semantics',
        prompt:
          'In a large React application with real-time data streaming into a parent dashboard, child chart components are experiencing sluggish re-rendering. Explain how React determines when to re-render, the exact mechanics of useMemo and useCallback, and when wrapping everything in memo is an anti-pattern.',
        difficulty: 'intermediate',
        expectedTimeSeconds: 150,
        rubric: {
          keySignals: [
            'Explains shallow comparison of props in React.memo and referential equality of callbacks',
            'Clarifies that useMemo caches computation results while useCallback preserves function references',
            'Identifies the overhead of useMemo (memory allocations + dependency array comparison on every render)',
            'Mentions state colocation and moving state down or lifting JSX up as architectural fixes',
          ],
          antiPatterns: [
            'Believing useMemo prevents the component itself from re-rendering without React.memo on child',
            'Applying useMemo to primitive calculations (e.g. 2 + 2) causing negative net performance',
            'Forgetting dependencies in hook dependency arrays',
          ],
          idealAnswerOutline: [
            '1. Render Trigger: React re-renders children whenever parent re-renders unless memoized.',
            '2. Referential Equality: Unmemoized inline functions and objects create new pointers every render.',
            '3. Strategic Memoization: React.memo on expensive leaves combined with useCallback for handlers.',
            '4. Structural Alternatives: Component composition (passing children as props) and state colocation.',
          ],
          sampleFollowUpQuestions: [
            'How does React 19 / React Compiler change how we think about manual useMemo?',
            'What is the difference between useTransition and useDeferredValue?',
          ],
        },
        tags: ['react', 'hooks', 'performance', 'frontend', 'javascript'],
      },
      {
        id: 'iq-fe-02',
        type: 'SYSTEM_DESIGN',
        skillId: 'frontend-performance',
        domainSlug: 'frontend-developer',
        title: 'Core Web Vitals & Web Performance Optimization',
        prompt:
          'Your team is tasked with improving an e-commerce web app whose Largest Contentful Paint (LCP) is 4.8s and Cumulative Layout Shift (CLS) is 0.35. Walk me through the root causes of these metrics and the architectural changes you would implement.',
        difficulty: 'advanced',
        expectedTimeSeconds: 180,
        rubric: {
          keySignals: [
            'Identifies LCP culprits: render-blocking CSS/JS, unoptimized hero images, slow server TTFB',
            'Identifies CLS culprits: unsized images/ads, dynamic content insertion without reserved containers, FOIT/FOUT web fonts',
            'Recommends modern image formats (AVIF/WebP), fetchpriority="high", responsive srcset, and preload',
            'Discusses code-splitting, route-based lazy loading, and critical CSS inlining',
          ],
          antiPatterns: [
            'Treating Lighthouse lab scores as identical to Real User Monitoring (RUM) field data',
            'Lazy-loading the hero above-the-fold image (which actually worsens LCP)',
            'Ignoring dimensions on images and dynamic banners',
          ],
          idealAnswerOutline: [
            '1. LCP Remediation: Preload hero image with fetchpriority="high", utilize modern CDN, eliminate render-blocking scripts.',
            '2. CLS Remediation: Explicit aspect-ratio or width/height on all media, font-display: optional with fallback font matchers.',
            '3. Bundle Hygiene: Route-based dynamic import() code splitting and tree shaking.',
            '4. Measurement: Tracking Field metrics via web-vitals library to analytics.',
          ],
          sampleFollowUpQuestions: [
            'What metric replaced First Input Delay (FID) in Core Web Vitals, and how do you optimize it?',
            'How does Server-Side Rendering (SSR) vs Static Site Generation (SSG) impact LCP and TTFB?',
          ],
        },
        tags: ['performance', 'core-web-vitals', 'seo', 'lighthouse', 'frontend'],
      },
      {
        id: 'iq-fe-03',
        type: 'TECHNICAL_DEEP_DIVE',
        skillId: 'javascript-es6',
        domainSlug: 'frontend-developer',
        title: 'JavaScript Event Loop, Microtasks & Async Concurrency',
        prompt:
          'Explain the JavaScript Event Loop execution order between synchronous code, Microtasks (Promise.then, queueMicrotask), and Macrotasks (setTimeout, requestAnimationFrame, I/O). What happens if a microtask recursively spawns more microtasks?',
        difficulty: 'intermediate',
        expectedTimeSeconds: 120,
        rubric: {
          keySignals: [
            'Clear execution hierarchy: Call Stack -> Complete all Microtasks -> Render Pipeline -> Next Macrotask',
            'Identifies that microtask queue is drained completely before returning to the event loop',
            'Explains that an infinite recursive microtask loop blocks rendering and freezes the main thread (unlike setTimeout)',
            'Mentions requestAnimationFrame timing relative to browser frame paint cycles',
          ],
          antiPatterns: [
            'Confusing setTimeout(fn, 0) with synchronous execution',
            'Thinking microtasks and macrotasks execute in alternating 1:1 order',
            'Claiming JavaScript is multi-threaded without mentioning Web Workers',
          ],
          idealAnswerOutline: [
            '1. Call Stack: Synchronous execution of frames until empty.',
            '2. Microtask Queue: Highest priority asynchronous work (Promises, MutationObserver); drains completely before yielding.',
            '3. Rendering: Style calculation, layout, and paint occurring between macrotasks.',
            '4. Macrotask Queue: Timers, UI events, network callbacks executed one per tick.',
          ],
          sampleFollowUpQuestions: [
            'How do Web Workers communicate with the main UI thread without blocking the event loop?',
            'What is the difference between Promise.all, Promise.allSettled, and Promise.race?',
          ],
        },
        tags: ['javascript', 'event-loop', 'async', 'concurrency', 'browser'],
      },

      // ==========================================
      // AI & DATA ENGINEER QUESTIONS
      // ==========================================
      {
        id: 'iq-ai-01',
        type: 'TECHNICAL_DEEP_DIVE',
        skillId: 'deep-learning-pytorch',
        domainSlug: 'ai-data-engineer',
        title: 'PyTorch Training Dynamics, Vanishing Gradients & Regularization',
        prompt:
          'While training a deep neural network in PyTorch, you observe that training loss converges rapidly to near-zero while validation loss spikes upward after epoch 10. Walk me through your diagnostic toolkit and the regularization techniques you would apply.',
        difficulty: 'intermediate',
        expectedTimeSeconds: 150,
        rubric: {
          keySignals: [
            'Diagnoses high variance / severe overfitting to training data',
            'Recommends early stopping, dropout, weight decay (L2 regularization), and data augmentation',
            'Inspects learning rate schedule (e.g. CosineAnnealingLR, ReduceLROnPlateau)',
            'Checks gradient norms (torch.nn.utils.clip_grad_norm_) and batch normalization dynamics',
          ],
          antiPatterns: [
            'Suggesting increasing model capacity/parameters to fix overfitting',
            'Confusing training/validation divergence with vanishing gradients or high bias',
            'Evaluating model performance on the training set alone',
          ],
          idealAnswerOutline: [
            '1. Diagnosis: Overfitting confirmed by training/validation divergence and generalization gap.',
            '2. Regularization: Applying Dropout (0.2-0.5), Weight Decay (AdamW optimizer), and Data Augmentation.',
            '3. Architecture: Implementing Residual connections and LayerNorm/BatchNorm.',
            '4. Training Strategy: Early Stopping using validation checkpointing and k-fold cross-validation.',
          ],
          sampleFollowUpQuestions: [
            'Why is AdamW preferred over Adam when using weight decay in deep transformers?',
            'What is the difference between Batch Normalization and Layer Normalization?',
          ],
        },
        tags: ['pytorch', 'deep-learning', 'machine-learning', 'optimization', 'ai'],
      },
      {
        id: 'iq-ai-02',
        type: 'SYSTEM_DESIGN',
        skillId: 'llms-prompt-engineering',
        domainSlug: 'ai-data-engineer',
        title: 'Production Retrieval-Augmented Generation (RAG) Architecture',
        prompt:
          'Design an enterprise RAG system that searches across 100,000 PDF technical manuals and delivers grounded, hallucination-resistant answers with citations. How do you approach chunking, embedding models, hybrid search, and hallucination guardrails?',
        difficulty: 'advanced',
        expectedTimeSeconds: 180,
        rubric: {
          keySignals: [
            'Discusses document chunking strategies (semantic chunking, sliding window with overlap) and metadata preservation',
            'Combines dense vector search (cosine/HNSW) with sparse keyword search (BM25) via Reciprocal Rank Fusion (RRF)',
            'Includes cross-encoder reranking (Cohere / BGE-reranker) to filter retrieved chunks',
            'Defines strict prompt guardrails, source attribution schemas, and confidence thresholding',
          ],
          antiPatterns: [
            'Using fixed arbitrary 1000-character chunking without overlap or semantic awareness',
            'Relying solely on vector embeddings without sparse keyword search for technical terms/acronyms',
            'Passing raw unscored top-K chunks directly to LLM without reranking or context window budgeting',
          ],
          idealAnswerOutline: [
            '1. Ingestion: OCR parsing, semantic chunking (512 tokens + 10% overlap), embedding via high-dimensional embedding model into Vector DB (Pinecone/Milvus/pgvector).',
            '2. Hybrid Retrieval: Dense vector + Sparse BM25 combined via Reciprocal Rank Fusion.',
            '3. Reranking: Top 25 retrieved chunks scored by Cross-Encoder to select top 5 most relevant.',
            '4. Synthesis & Guardrails: Grounded system prompt enforcing citations, out-of-domain fallback, and hallucination validation.',
          ],
          sampleFollowUpQuestions: [
            'How do you evaluate RAG quality programmatically (e.g. RAGAS metrics: context precision, faithfulness)?',
            'How do you handle multi-hop questions requiring information from multiple disparate documents?',
          ],
        },
        tags: ['rag', 'llm', 'vector-database', 'embeddings', 'ai-architecture'],
      },

      // ==========================================
      // BEHAVIORAL QUESTIONS (STAR METHOD)
      // ==========================================
      {
        id: 'iq-beh-01',
        type: 'BEHAVIORAL',
        skillId: 'general-behavioral',
        domainSlug: 'general',
        title: 'Technical Disagreement & Architectural Consensus',
        prompt:
          'Tell me about a time when you and a senior teammate or tech lead strongly disagreed on a technical decision or architecture choice. How did you handle the situation, and what was the outcome?',
        difficulty: 'intermediate',
        expectedTimeSeconds: 150,
        rubric: {
          keySignals: [
            'Uses clear STAR structure (Situation, Task, Action, Result)',
            'Separates objective technical trade-offs from personal ego or emotion',
            'Proactively created a spike, benchmark, or RFC/design doc with measurable metrics',
            'Demonstrates "Disagree and Commit" when a team consensus or final decision was reached',
          ],
          antiPatterns: [
            'Blaming teammates or portraying the other person as stubborn/incompetent',
            'Passive-aggressively writing code against the agreed decision',
            'Failing to articulate the actual business or technical impact of the resolution',
          ],
          idealAnswerOutline: [
            'Situation: Context of the feature and conflicting technical approaches (e.g. SQL vs NoSQL, REST vs gRPC).',
            'Task: Need to resolve the architecture decision without blocking sprint deliverables.',
            'Action: Conducted a localized prototype benchmark, created comparison matrix (latency, maintainability, cost), and facilitated an open team review.',
            'Result: Team aligned on the data-backed decision, shipped on schedule, with post-launch reliability documented.',
          ],
          sampleFollowUpQuestions: [
            'If the final decision had gone against your recommendation, how would you have supported the team?',
            'What did you learn about cross-functional technical communication from that experience?',
          ],
        },
        tags: ['behavioral', 'star-method', 'conflict-resolution', 'communication', 'leadership'],
      },
      {
        id: 'iq-beh-02',
        type: 'BEHAVIORAL',
        skillId: 'general-behavioral',
        domainSlug: 'general',
        title: 'High-Severity Production Outage & Blameless Post-Mortem',
        prompt:
          'Describe a situation where a critical bug, regression, or service outage occurred in production under your watch. Walk me through how you triaged the incident, communicated with stakeholders, and prevented future recurrences.',
        difficulty: 'intermediate',
        expectedTimeSeconds: 150,
        rubric: {
          keySignals: [
            'Prioritizes rapid mitigation / rollback over root cause debate during active incident',
            'Clear communication with incident commanders, engineering peers, and impacted users',
            'Conducts a blameless post-mortem analyzing systemic and procedural root causes (5 Whys)',
            'Follows up with automated testing, CI/CD guards, or alerting improvements',
          ],
          antiPatterns: [
            'Panic-debugging directly in production database without rollback or feature flag isolation',
            'Hiding the incident or pointing fingers at individuals',
            'Closing the issue without adding automated regression tests or monitoring',
          ],
          idealAnswerOutline: [
            'Situation: High-severity incident context (e.g. payment failure, database lock contention, memory leak).',
            'Task: Restore user service availability immediately and preserve audit telemetry.',
            'Action: Executed automated rollback / circuit breaker, established incident status updates, and captured diagnostic logs.',
            'Result: Service restored within SLA; authored blameless post-mortem, added automated integration smoke tests, and refined alerting thresholds.',
          ],
          sampleFollowUpQuestions: [
            'How do you balance rapid feature delivery with post-incident stability investments?',
            'How did you communicate the issue to non-technical executive leadership?',
          ],
        },
        tags: ['behavioral', 'star-method', 'incident-response', 'devops', 'post-mortem'],
      },
    ];

    for (const q of seedList) {
      this.questionsMap.set(q.id, q);
    }
  }
}

export const interviewQuestionBankService = new InterviewQuestionBankService();
