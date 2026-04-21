export interface Question {
  id: string;
  text: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  expectedKeywords: string[];
  timeLimit: number;
}

export interface InterviewSession {
  id: string;
  role: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  questions: Question[];
  answers: string[];
  scores: number[];
  feedbacks: string[];
  suggestions: string[][];
  startTime: number;
  currentQuestionIndex: number;
  isCompleted: boolean;
  totalScore: number;
}

type TopicSeed = {
  text: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  expectedKeywords: string[];
};

function createQuestionSet(prefix: string, seeds: TopicSeed[]): Question[] {
  return seeds.map((seed, index) => ({
    id: `${prefix}-${index + 1}`,
    text: seed.text,
    category: seed.category,
    difficulty: seed.difficulty,
    expectedKeywords: seed.expectedKeywords,
    timeLimit: seed.difficulty === 'advanced' ? 150 : seed.difficulty === 'intermediate' ? 120 : 90,
  }));
}

const frontendSeeds: TopicSeed[] = [
  { text: 'Explain `let`, `const`, and `var` and when you would use each.', category: 'JavaScript', difficulty: 'beginner', expectedKeywords: ['scope', 'hoisting', 'block', 'reassignment'] },
  { text: 'How does the React rendering lifecycle work in functional components?', category: 'React', difficulty: 'beginner', expectedKeywords: ['render', 'state', 'props', 're-render'] },
  { text: 'What is the Virtual DOM and why does it matter?', category: 'React', difficulty: 'beginner', expectedKeywords: ['virtual dom', 'diffing', 'reconciliation', 'performance'] },
  { text: 'How do you structure reusable components in a growing React app?', category: 'Architecture', difficulty: 'intermediate', expectedKeywords: ['composition', 'props', 'abstraction', 'reusability'] },
  { text: 'Explain event delegation in JavaScript with a practical example.', category: 'JavaScript', difficulty: 'intermediate', expectedKeywords: ['event bubbling', 'listener', 'target', 'performance'] },
  { text: 'How do you optimize Core Web Vitals in a frontend app?', category: 'Performance', difficulty: 'intermediate', expectedKeywords: ['lcp', 'cls', 'inp', 'optimization'] },
  { text: 'When would you use CSS Grid over Flexbox?', category: 'CSS', difficulty: 'beginner', expectedKeywords: ['layout', 'grid', 'flexbox', 'alignment'] },
  { text: 'Describe a robust state management strategy for a medium-sized app.', category: 'State Management', difficulty: 'intermediate', expectedKeywords: ['context', 'redux', 'zustand', 'global state'] },
  { text: 'How do you implement authentication flows securely in SPA apps?', category: 'Security', difficulty: 'advanced', expectedKeywords: ['token', 'refresh', 'http only', 'xss', 'csrf'] },
  { text: 'What are common causes of unnecessary re-renders and how do you fix them?', category: 'Performance', difficulty: 'advanced', expectedKeywords: ['memo', 'usememo', 'usecallback', 'profiling'] },
  { text: 'How do you design a frontend architecture for multi-team scale?', category: 'Architecture', difficulty: 'advanced', expectedKeywords: ['modular', 'design system', 'ownership', 'scalability'] },
  { text: 'How do you test React components effectively?', category: 'Testing', difficulty: 'intermediate', expectedKeywords: ['unit testing', 'integration testing', 'jest', 'testing library'] },
  { text: 'Explain semantic HTML and its impact on accessibility.', category: 'Accessibility', difficulty: 'beginner', expectedKeywords: ['semantic', 'screen reader', 'aria', 'keyboard'] },
  { text: 'How do you debug memory leaks in frontend applications?', category: 'Debugging', difficulty: 'advanced', expectedKeywords: ['cleanup', 'useeffect', 'listeners', 'profiling'] },
  { text: 'What is code splitting and when should it be applied?', category: 'Performance', difficulty: 'intermediate', expectedKeywords: ['lazy loading', 'bundle', 'dynamic import', 'route based'] },
  { text: 'How do you ensure cross-browser compatibility?', category: 'Quality', difficulty: 'intermediate', expectedKeywords: ['polyfill', 'feature detection', 'testing', 'fallback'] },
  { text: 'Explain TypeScript interfaces vs types with examples.', category: 'TypeScript', difficulty: 'beginner', expectedKeywords: ['interface', 'type', 'extends', 'union'] },
  { text: 'How do you manage forms and validation in complex UIs?', category: 'Frontend UX', difficulty: 'intermediate', expectedKeywords: ['validation', 'form state', 'errors', 'user feedback'] },
  { text: 'How do you implement feature flags safely in frontend code?', category: 'Release Engineering', difficulty: 'advanced', expectedKeywords: ['feature flag', 'rollout', 'fallback', 'monitoring'] },
  { text: 'Describe your approach to building and maintaining a design system.', category: 'Design System', difficulty: 'advanced', expectedKeywords: ['tokens', 'components', 'consistency', 'documentation'] },
  { text: 'How would you migrate a large JS codebase to TypeScript?', category: 'Migration', difficulty: 'advanced', expectedKeywords: ['incremental', 'strict', 'types', 'refactor'] },
  { text: 'How do you make a React app SEO-friendly?', category: 'SEO', difficulty: 'intermediate', expectedKeywords: ['ssr', 'metadata', 'rendering', 'crawl'] },
];

const backendSeeds: TopicSeed[] = [
  { text: 'Explain REST fundamentals and common HTTP methods.', category: 'API', difficulty: 'beginner', expectedKeywords: ['rest', 'http', 'get', 'post', 'put', 'delete'] },
  { text: 'How do you design idempotent APIs?', category: 'API', difficulty: 'intermediate', expectedKeywords: ['idempotent', 'retry', 'safety', 'consistency'] },
  { text: 'How do you structure backend services for maintainability?', category: 'Architecture', difficulty: 'intermediate', expectedKeywords: ['layered', 'modular', 'service', 'repository'] },
  { text: 'When do you choose SQL vs NoSQL databases?', category: 'Database', difficulty: 'beginner', expectedKeywords: ['sql', 'nosql', 'schema', 'consistency'] },
  { text: 'How do you optimize slow database queries?', category: 'Database', difficulty: 'intermediate', expectedKeywords: ['index', 'explain', 'join', 'query plan'] },
  { text: 'Describe your approach to authentication and authorization.', category: 'Security', difficulty: 'intermediate', expectedKeywords: ['jwt', 'oauth', 'roles', 'permissions'] },
  { text: 'How do you handle distributed transactions?', category: 'Architecture', difficulty: 'advanced', expectedKeywords: ['saga', 'eventual consistency', 'compensation', 'orchestration'] },
  { text: 'How do you design for observability in production?', category: 'Reliability', difficulty: 'advanced', expectedKeywords: ['logs', 'metrics', 'traces', 'alerts'] },
  { text: 'What strategies do you use for caching?', category: 'Performance', difficulty: 'intermediate', expectedKeywords: ['cache', 'ttl', 'redis', 'invalidation'] },
  { text: 'How do you secure backend APIs against common attacks?', category: 'Security', difficulty: 'advanced', expectedKeywords: ['rate limit', 'sql injection', 'xss', 'csrf', 'validation'] },
  { text: 'How do message queues improve backend architecture?', category: 'Scalability', difficulty: 'advanced', expectedKeywords: ['queue', 'async', 'retry', 'dead letter'] },
  { text: 'Explain API versioning strategies.', category: 'API', difficulty: 'intermediate', expectedKeywords: ['versioning', 'backward compatibility', 'deprecation', 'contract'] },
  { text: 'How do you design and run safe database migrations?', category: 'Database', difficulty: 'advanced', expectedKeywords: ['migration', 'rollback', 'zero downtime', 'backfill'] },
  { text: 'How do you manage secrets in production?', category: 'Security', difficulty: 'intermediate', expectedKeywords: ['secrets manager', 'rotation', 'env', 'encryption'] },
  { text: 'How do you approach error handling in APIs?', category: 'Reliability', difficulty: 'beginner', expectedKeywords: ['status code', 'error response', 'logging', 'retry'] },
  { text: 'Explain eventual consistency with a practical example.', category: 'Distributed Systems', difficulty: 'advanced', expectedKeywords: ['eventual consistency', 'replication', 'latency', 'tradeoff'] },
  { text: 'How do you build multi-tenant backend systems?', category: 'Architecture', difficulty: 'advanced', expectedKeywords: ['tenant isolation', 'rbac', 'schema', 'security'] },
  { text: 'How do you implement rate limiting effectively?', category: 'API', difficulty: 'intermediate', expectedKeywords: ['rate limiting', 'throttling', 'token bucket', 'abuse'] },
  { text: 'What is the N+1 query problem and how do you solve it?', category: 'Database', difficulty: 'intermediate', expectedKeywords: ['n+1', 'joins', 'batching', 'optimization'] },
  { text: 'How do you benchmark backend performance?', category: 'Performance', difficulty: 'intermediate', expectedKeywords: ['load testing', 'latency', 'throughput', 'profiling'] },
  { text: 'How do you ensure API contracts remain stable across teams?', category: 'Collaboration', difficulty: 'advanced', expectedKeywords: ['contract', 'schema', 'testing', 'versioning'] },
  { text: 'How do you decide between monolith and microservices?', category: 'Architecture', difficulty: 'advanced', expectedKeywords: ['tradeoff', 'microservices', 'monolith', 'complexity'] },
];

const fullStackSeeds: TopicSeed[] = [
  { text: 'How do frontend and backend contracts stay aligned?', category: 'Collaboration', difficulty: 'intermediate', expectedKeywords: ['api contract', 'types', 'versioning', 'communication'] },
  { text: 'Explain the request lifecycle from browser to database.', category: 'System Fundamentals', difficulty: 'beginner', expectedKeywords: ['http', 'server', 'database', 'response'] },
  { text: 'How do you handle authentication end-to-end?', category: 'Security', difficulty: 'intermediate', expectedKeywords: ['auth', 'token', 'session', 'permissions'] },
  { text: 'How do you design an end-to-end feature for scalability?', category: 'Architecture', difficulty: 'advanced', expectedKeywords: ['scalability', 'caching', 'queue', 'database'] },
  { text: 'What are trade-offs between SSR and CSR?', category: 'Frontend Architecture', difficulty: 'intermediate', expectedKeywords: ['ssr', 'csr', 'seo', 'performance'] },
  { text: 'How do you set up CI/CD for a full-stack project?', category: 'DevOps', difficulty: 'intermediate', expectedKeywords: ['ci/cd', 'testing', 'deployment', 'rollback'] },
  { text: 'How do you ensure data consistency across frontend and backend?', category: 'Data', difficulty: 'advanced', expectedKeywords: ['validation', 'schema', 'consistency', 'transactions'] },
  { text: 'How do you profile bottlenecks across the stack?', category: 'Performance', difficulty: 'advanced', expectedKeywords: ['profiling', 'frontend', 'backend', 'database'] },
  { text: 'How do you design reusable modules in a monorepo?', category: 'Architecture', difficulty: 'advanced', expectedKeywords: ['monorepo', 'shared code', 'boundaries', 'versioning'] },
  { text: 'What is your approach to full-stack testing?', category: 'Testing', difficulty: 'intermediate', expectedKeywords: ['unit', 'integration', 'e2e', 'coverage'] },
  { text: 'How do you secure data in transit and at rest?', category: 'Security', difficulty: 'beginner', expectedKeywords: ['tls', 'encryption', 'secrets', 'compliance'] },
  { text: 'How do you approach pagination and infinite scroll?', category: 'Data UX', difficulty: 'intermediate', expectedKeywords: ['pagination', 'cursor', 'offset', 'performance'] },
  { text: 'How would you design a notification system end-to-end?', category: 'System Design', difficulty: 'advanced', expectedKeywords: ['queue', 'worker', 'retry', 'delivery'] },
  { text: 'How do you handle schema changes with active clients?', category: 'Data', difficulty: 'advanced', expectedKeywords: ['backward compatible', 'migration', 'versioning', 'deprecation'] },
  { text: 'How do you improve developer experience in a full-stack team?', category: 'Team Productivity', difficulty: 'intermediate', expectedKeywords: ['tooling', 'automation', 'documentation', 'standards'] },
  { text: 'How do you manage feature flags across frontend and backend?', category: 'Release Engineering', difficulty: 'advanced', expectedKeywords: ['feature flag', 'rollout', 'observability', 'fallback'] },
  { text: 'How do you troubleshoot production incidents quickly?', category: 'Operations', difficulty: 'intermediate', expectedKeywords: ['logs', 'alerts', 'timeline', 'root cause'] },
  { text: 'How do you choose between GraphQL and REST for new features?', category: 'API', difficulty: 'intermediate', expectedKeywords: ['graphql', 'rest', 'tradeoff', 'use case'] },
  { text: 'How do you model RBAC end-to-end?', category: 'Security', difficulty: 'advanced', expectedKeywords: ['rbac', 'roles', 'permissions', 'authorization'] },
  { text: 'How do you measure feature success technically and product-wise?', category: 'Product Engineering', difficulty: 'intermediate', expectedKeywords: ['metrics', 'monitoring', 'analytics', 'outcomes'] },
  { text: 'How do you avoid duplicated business logic across layers?', category: 'Architecture', difficulty: 'advanced', expectedKeywords: ['single source', 'shared validation', 'domain layer', 'consistency'] },
  { text: 'How would you migrate a legacy full-stack app incrementally?', category: 'Migration', difficulty: 'advanced', expectedKeywords: ['incremental', 'strangler', 'risk', 'rollback'] },
];

const dataAnalystSeeds: TopicSeed[] = [
  { text: 'What is the difference between descriptive and inferential statistics?', category: 'Statistics', difficulty: 'beginner', expectedKeywords: ['descriptive', 'inferential', 'sample', 'population'] },
  { text: 'How do you clean a noisy dataset?', category: 'Data Cleaning', difficulty: 'beginner', expectedKeywords: ['missing values', 'outliers', 'dedupe', 'standardize'] },
  { text: 'How do you approach exploratory data analysis?', category: 'EDA', difficulty: 'intermediate', expectedKeywords: ['eda', 'distribution', 'correlation', 'visualization'] },
  { text: 'Explain bias and variance with real analysis scenarios.', category: 'Modeling', difficulty: 'intermediate', expectedKeywords: ['bias', 'variance', 'overfitting', 'underfitting'] },
  { text: 'How do you validate an A/B test result?', category: 'Experimentation', difficulty: 'intermediate', expectedKeywords: ['hypothesis', 'p-value', 'confidence', 'sample size'] },
  { text: 'How do you communicate insights to non-technical stakeholders?', category: 'Communication', difficulty: 'beginner', expectedKeywords: ['storytelling', 'visualization', 'impact', 'recommendation'] },
  { text: 'How do window functions improve SQL analysis?', category: 'SQL', difficulty: 'advanced', expectedKeywords: ['window function', 'partition', 'rank', 'aggregation'] },
  { text: 'How do you design a KPI dashboard?', category: 'BI', difficulty: 'intermediate', expectedKeywords: ['kpi', 'dashboard', 'metric', 'drilldown'] },
  { text: 'How do you detect and handle outliers?', category: 'Statistics', difficulty: 'intermediate', expectedKeywords: ['iqr', 'z-score', 'outlier', 'treatment'] },
  { text: 'How do you choose the right chart for a dataset?', category: 'Visualization', difficulty: 'beginner', expectedKeywords: ['bar', 'line', 'scatter', 'clarity'] },
  { text: 'How do you evaluate data quality in a pipeline?', category: 'Data Quality', difficulty: 'advanced', expectedKeywords: ['completeness', 'accuracy', 'consistency', 'monitoring'] },
  { text: 'How do you handle class imbalance in modeling?', category: 'Modeling', difficulty: 'advanced', expectedKeywords: ['imbalance', 'sampling', 'precision', 'recall'] },
  { text: 'How do you build reproducible analytics workflows?', category: 'Process', difficulty: 'intermediate', expectedKeywords: ['version control', 'notebook', 'pipeline', 'documentation'] },
  { text: 'Explain the ETL workflow you would design for weekly reporting.', category: 'Data Engineering', difficulty: 'intermediate', expectedKeywords: ['extract', 'transform', 'load', 'validation'] },
  { text: 'How do you identify causation vs correlation issues?', category: 'Statistics', difficulty: 'advanced', expectedKeywords: ['confounder', 'causation', 'correlation', 'experiment'] },
  { text: 'How would you segment users for product insights?', category: 'Analytics', difficulty: 'intermediate', expectedKeywords: ['segmentation', 'cohort', 'behavior', 'metric'] },
  { text: 'How do you reduce dashboard performance issues?', category: 'BI', difficulty: 'advanced', expectedKeywords: ['optimization', 'query', 'materialized view', 'caching'] },
  { text: 'How do you explain confidence intervals to business teams?', category: 'Communication', difficulty: 'beginner', expectedKeywords: ['confidence interval', 'uncertainty', 'estimate', 'range'] },
  { text: 'How do you define North Star metrics for a product?', category: 'Product Analytics', difficulty: 'advanced', expectedKeywords: ['north star', 'alignment', 'tradeoff', 'outcome'] },
  { text: 'How do you audit data lineage in analytics systems?', category: 'Governance', difficulty: 'advanced', expectedKeywords: ['lineage', 'source', 'transformation', 'audit'] },
  { text: 'How do you prioritize analytics requests from multiple teams?', category: 'Workflow', difficulty: 'intermediate', expectedKeywords: ['prioritization', 'impact', 'stakeholder', 'roadmap'] },
  { text: 'How do you improve reliability of recurring reports?', category: 'Operations', difficulty: 'intermediate', expectedKeywords: ['automation', 'checks', 'scheduling', 'alerts'] },
];

const devOpsSeeds: TopicSeed[] = [
  { text: 'What does CI/CD mean in practical delivery workflows?', category: 'CI/CD', difficulty: 'beginner', expectedKeywords: ['continuous integration', 'continuous delivery', 'automation', 'pipeline'] },
  { text: 'How do you design a reliable deployment pipeline?', category: 'Delivery', difficulty: 'intermediate', expectedKeywords: ['pipeline', 'stages', 'rollback', 'gates'] },
  { text: 'How do you use Docker in local and production environments?', category: 'Containers', difficulty: 'beginner', expectedKeywords: ['docker', 'image', 'container', 'consistency'] },
  { text: 'How do you manage Kubernetes workloads safely?', category: 'Orchestration', difficulty: 'intermediate', expectedKeywords: ['kubernetes', 'deployment', 'service', 'autoscaling'] },
  { text: 'How do you set SLOs and SLIs for services?', category: 'Reliability', difficulty: 'advanced', expectedKeywords: ['slo', 'sli', 'error budget', 'availability'] },
  { text: 'How do you implement observability at scale?', category: 'Observability', difficulty: 'advanced', expectedKeywords: ['logs', 'metrics', 'traces', 'dashboard'] },
  { text: 'How do you secure cloud infrastructure?', category: 'Security', difficulty: 'intermediate', expectedKeywords: ['iam', 'least privilege', 'network', 'encryption'] },
  { text: 'How do you automate infrastructure with Terraform?', category: 'IaC', difficulty: 'intermediate', expectedKeywords: ['terraform', 'state', 'plan', 'apply'] },
  { text: 'How do you handle incident response in production?', category: 'Operations', difficulty: 'advanced', expectedKeywords: ['incident', 'runbook', 'postmortem', 'mitigation'] },
  { text: 'How do blue-green and canary releases differ?', category: 'Release Strategy', difficulty: 'intermediate', expectedKeywords: ['blue-green', 'canary', 'traffic', 'rollback'] },
  { text: 'How do you optimize cloud costs without reliability trade-offs?', category: 'Cost Optimization', difficulty: 'advanced', expectedKeywords: ['cost', 'rightsizing', 'autoscaling', 'efficiency'] },
  { text: 'How do you manage secrets in pipelines and clusters?', category: 'Security', difficulty: 'intermediate', expectedKeywords: ['secrets', 'vault', 'rotation', 'access control'] },
  { text: 'How do you design a backup and disaster recovery strategy?', category: 'Reliability', difficulty: 'advanced', expectedKeywords: ['backup', 'restore', 'rpo', 'rto'] },
  { text: 'How do you monitor and alert effectively?', category: 'Monitoring', difficulty: 'beginner', expectedKeywords: ['alert', 'threshold', 'noise', 'response'] },
  { text: 'How do you harden Linux servers for production?', category: 'Infrastructure', difficulty: 'intermediate', expectedKeywords: ['linux', 'hardening', 'patching', 'permissions'] },
  { text: 'How do you validate infrastructure changes before deploy?', category: 'IaC', difficulty: 'intermediate', expectedKeywords: ['plan', 'review', 'policy', 'validation'] },
  { text: 'How do you build self-healing systems?', category: 'Reliability', difficulty: 'advanced', expectedKeywords: ['auto recovery', 'health check', 'resilience', 'redundancy'] },
  { text: 'How do you scale CI pipelines for many teams?', category: 'Platform', difficulty: 'advanced', expectedKeywords: ['parallelization', 'caching', 'runners', 'governance'] },
  { text: 'How do you implement policy-as-code?', category: 'Governance', difficulty: 'advanced', expectedKeywords: ['policy', 'compliance', 'automation', 'enforcement'] },
  { text: 'How do you reduce deployment risk for critical services?', category: 'Release Strategy', difficulty: 'advanced', expectedKeywords: ['risk', 'progressive rollout', 'monitoring', 'rollback'] },
  { text: 'How do you manage multi-environment configuration?', category: 'Configuration', difficulty: 'intermediate', expectedKeywords: ['environment', 'config', 'separation', 'consistency'] },
  { text: 'How do you diagnose performance regressions after release?', category: 'Operations', difficulty: 'intermediate', expectedKeywords: ['baseline', 'regression', 'metrics', 'profiling'] },
];

export const questionsBank: Record<string, Question[]> = {
  'Frontend Developer': createQuestionSet('fe', frontendSeeds),
  'Backend Developer': createQuestionSet('be', backendSeeds),
  'Full Stack Developer': createQuestionSet('fs', fullStackSeeds),
  'Data Analyst': createQuestionSet('da', dataAnalystSeeds),
  'DevOps Engineer': createQuestionSet('do', devOpsSeeds),
};

export function getQuestionsForRole(role: string, difficulty: 'beginner' | 'intermediate' | 'advanced'): Question[] {
  const roleQuestions = questionsBank[role] ?? [];

  const exact = roleQuestions.filter((question) => question.difficulty === difficulty);
  if (exact.length >= 8) {
    return exact.slice(0, 10);
  }

  const weighted = roleQuestions.filter((question) => {
    if (difficulty === 'beginner') return question.difficulty !== 'advanced';
    if (difficulty === 'advanced') return question.difficulty !== 'beginner';
    return true;
  });

  return weighted.slice(0, 10);
}

export function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
