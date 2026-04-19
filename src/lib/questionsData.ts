// src/lib/questionsData.ts

export interface Question {
  id: string;
  text: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  expectedKeywords: string[];
  timeLimit: number; // in seconds
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

export const questionsBank: Record<string, Question[]> = {
  'Frontend Developer': [
    {
      id: 'fe-1',
      text: 'Explain the difference between let, const, and var in JavaScript.',
      category: 'JavaScript Fundamentals',
      difficulty: 'beginner',
      expectedKeywords: ['scope', 'hoisting', 'reassignment', 'block', 'function'],
      timeLimit: 60
    },
    {
      id: 'fe-2',
      text: 'What is the virtual DOM in React and how does it improve performance?',
      category: 'React',
      difficulty: 'intermediate',
      expectedKeywords: ['virtual dom', 'diffing', 'reconciliation', 'efficient', 'updates'],
      timeLimit: 90
    },
    {
      id: 'fe-3',
      text: 'How would you optimize a React application that is experiencing performance issues?',
      category: 'React Performance',
      difficulty: 'advanced',
      expectedKeywords: ['memo', 'usecallback', 'useeffect', 'lazy loading', 'code splitting'],
      timeLimit: 120
    },
    {
      id: 'fe-4',
      text: 'Explain CSS Grid vs Flexbox and when to use each.',
      category: 'CSS',
      difficulty: 'intermediate',
      expectedKeywords: ['grid', 'flexbox', 'layout', 'responsive', 'alignment'],
      timeLimit: 90
    },
    {
      id: 'fe-5',
      text: 'What are React hooks and how do they differ from class components?',
      category: 'React',
      difficulty: 'beginner',
      expectedKeywords: ['hooks', 'useState', 'useEffect', 'functional', 'class'],
      timeLimit: 60
    },
    {
      id: 'fe-6',
      text: 'How do you handle state management in a large-scale React application?',
      category: 'State Management',
      difficulty: 'advanced',
      expectedKeywords: ['redux', 'context', 'zustand', 'recoil', 'global state'],
      timeLimit: 120
    },
    {
      id: 'fe-7',
      text: 'Explain the concept of closures in JavaScript with a practical example.',
      category: 'JavaScript',
      difficulty: 'intermediate',
      expectedKeywords: ['closure', 'scope', 'function', 'lexical', 'private'],
      timeLimit: 90
    },
    {
      id: 'fe-8',
      text: 'What is TypeScript and what benefits does it provide over JavaScript?',
      category: 'TypeScript',
      difficulty: 'beginner',
      expectedKeywords: ['typescript', 'types', 'interfaces', 'compile-time', 'errors'],
      timeLimit: 60
    },
    {
      id: 'fe-9',
      text: 'How would you implement responsive design using CSS?',
      category: 'CSS',
      difficulty: 'intermediate',
      expectedKeywords: ['media queries', 'flexible', 'grid', 'viewport', 'mobile-first'],
      timeLimit: 90
    },
    {
      id: 'fe-10',
      text: 'Explain the component lifecycle in React and the useEffect hook.',
      category: 'React',
      difficulty: 'intermediate',
      expectedKeywords: ['lifecycle', 'useeffect', 'mounting', 'updating', 'unmounting'],
      timeLimit: 90
    },
    {
      id: 'fe-11',
      text: 'What are Webpack and Babel, and how do they help in frontend development?',
      category: 'Build Tools',
      difficulty: 'intermediate',
      expectedKeywords: ['webpack', 'babel', 'bundling', 'transpiling', 'modules'],
      timeLimit: 90
    },
    {
      id: 'fe-12',
      text: 'How do you handle asynchronous operations in JavaScript?',
      category: 'JavaScript',
      difficulty: 'intermediate',
      expectedKeywords: ['async', 'await', 'promises', 'callbacks', 'fetch'],
      timeLimit: 90
    },
    {
      id: 'fe-13',
      text: 'Explain the concept of CSS specificity and how it affects styling.',
      category: 'CSS',
      difficulty: 'intermediate',
      expectedKeywords: ['specificity', 'selectors', 'cascade', 'important', 'inheritance'],
      timeLimit: 90
    },
    {
      id: 'fe-14',
      text: 'What are Progressive Web Apps (PWAs) and their key features?',
      category: 'PWA',
      difficulty: 'advanced',
      expectedKeywords: ['pwa', 'service worker', 'manifest', 'offline', 'installable'],
      timeLimit: 120
    },
    {
      id: 'fe-15',
      text: 'How would you implement accessibility (a11y) in a React application?',
      category: 'Accessibility',
      difficulty: 'advanced',
      expectedKeywords: ['aria', 'semantic html', 'keyboard', 'screen readers', 'contrast'],
      timeLimit: 120
    }
  ],
  'Backend Developer': [
    {
      id: 'be-1',
      text: 'Explain the difference between REST and GraphQL APIs.',
      category: 'APIs',
      difficulty: 'intermediate',
      expectedKeywords: ['rest', 'graphql', 'endpoints', 'over-fetching', 'under-fetching'],
      timeLimit: 90
    },
    {
      id: 'be-2',
      text: 'How do you handle database migrations in a production environment?',
      category: 'Database',
      difficulty: 'advanced',
      expectedKeywords: ['migration', 'rollback', 'versioning', 'downtime', 'data integrity'],
      timeLimit: 120
    },
    {
      id: 'be-3',
      text: 'What are microservices and what are their advantages and disadvantages?',
      category: 'Architecture',
      difficulty: 'advanced',
      expectedKeywords: ['microservices', 'scalability', 'independence', 'complexity', 'communication'],
      timeLimit: 120
    },
    {
      id: 'be-4',
      text: 'Explain SQL vs NoSQL databases and when to use each.',
      category: 'Database',
      difficulty: 'intermediate',
      expectedKeywords: ['sql', 'nosql', 'relational', 'document', 'flexibility', 'consistency'],
      timeLimit: 90
    },
    {
      id: 'be-5',
      text: 'How do you implement authentication and authorization in a web application?',
      category: 'Security',
      difficulty: 'intermediate',
      expectedKeywords: ['jwt', 'oauth', 'session', 'bcrypt', 'middleware'],
      timeLimit: 90
    },
    {
      id: 'be-6',
      text: 'What is Docker and how does it help in backend development?',
      category: 'DevOps',
      difficulty: 'intermediate',
      expectedKeywords: ['docker', 'containers', 'isolation', 'portability', 'consistency'],
      timeLimit: 90
    },
    {
      id: 'be-7',
      text: 'Explain the concept of caching and different caching strategies.',
      category: 'Performance',
      difficulty: 'advanced',
      expectedKeywords: ['cache', 'redis', 'memcached', 'ttl', 'invalidation'],
      timeLimit: 120
    },
    {
      id: 'be-8',
      text: 'How do you handle error handling and logging in a backend application?',
      category: 'Error Handling',
      difficulty: 'intermediate',
      expectedKeywords: ['try-catch', 'middleware', 'logging', 'monitoring', 'alerts'],
      timeLimit: 90
    },
    {
      id: 'be-9',
      text: 'What are design patterns and can you give examples of common ones?',
      category: 'Design Patterns',
      difficulty: 'advanced',
      expectedKeywords: ['singleton', 'factory', 'observer', 'strategy', 'decorator'],
      timeLimit: 120
    },
    {
      id: 'be-10',
      text: 'How do you optimize database queries for better performance?',
      category: 'Database',
      difficulty: 'intermediate',
      expectedKeywords: ['indexing', 'joins', 'pagination', 'n+1 problem', 'query optimization'],
      timeLimit: 90
    }
  ],
  'Data Analyst': [
    {
      id: 'da-1',
      text: 'Explain the difference between supervised and unsupervised learning.',
      category: 'Machine Learning',
      difficulty: 'intermediate',
      expectedKeywords: ['supervised', 'unsupervised', 'labeled', 'unlabeled', 'clustering', 'regression'],
      timeLimit: 90
    },
    {
      id: 'da-2',
      text: 'How do you handle missing data in a dataset?',
      category: 'Data Cleaning',
      difficulty: 'intermediate',
      expectedKeywords: ['missing values', 'imputation', 'deletion', 'mean', 'median', 'mode'],
      timeLimit: 90
    },
    {
      id: 'da-3',
      text: 'What is SQL and can you write a query to find the top 5 customers by revenue?',
      category: 'SQL',
      difficulty: 'beginner',
      expectedKeywords: ['select', 'from', 'where', 'order by', 'limit', 'group by'],
      timeLimit: 60
    },
    {
      id: 'da-4',
      text: 'Explain the concept of A/B testing and how you would design one.',
      category: 'Statistics',
      difficulty: 'intermediate',
      expectedKeywords: ['ab testing', 'hypothesis', 'control', 'variant', 'statistical significance'],
      timeLimit: 90
    },
    {
      id: 'da-5',
      text: 'What are pandas and numpy, and how are they used in data analysis?',
      category: 'Python',
      difficulty: 'beginner',
      expectedKeywords: ['pandas', 'numpy', 'dataframe', 'arrays', 'data manipulation'],
      timeLimit: 60
    },
    {
      id: 'da-6',
      text: 'How do you identify and handle outliers in your data?',
      category: 'Data Analysis',
      difficulty: 'intermediate',
      expectedKeywords: ['outliers', 'iqr', 'z-score', 'box plot', 'removal', 'transformation'],
      timeLimit: 90
    },
    {
      id: 'da-7',
      text: 'Explain the difference between correlation and causation.',
      category: 'Statistics',
      difficulty: 'intermediate',
      expectedKeywords: ['correlation', 'causation', 'spurious', 'confounding', 'experimental design'],
      timeLimit: 90
    },
    {
      id: 'da-8',
      text: 'What is data normalization and when should you use it?',
      category: 'Data Processing',
      difficulty: 'intermediate',
      expectedKeywords: ['normalization', 'standardization', 'scaling', 'min-max', 'z-score'],
      timeLimit: 90
    },
    {
      id: 'da-9',
      text: 'How would you create a dashboard to visualize key business metrics?',
      category: 'Visualization',
      difficulty: 'intermediate',
      expectedKeywords: ['tableau', 'power bi', 'charts', 'kpis', 'dashboard', 'visualization'],
      timeLimit: 90
    },
    {
      id: 'da-10',
      text: 'Explain the ETL process and its importance in data pipelines.',
      category: 'Data Engineering',
      difficulty: 'intermediate',
      expectedKeywords: ['etl', 'extract', 'transform', 'load', 'data pipeline', 'integration'],
      timeLimit: 90
    }
  ],
  'DevOps Engineer': [
    {
      id: 'do-1',
      text: 'What is CI/CD and why is it important?',
      category: 'CI/CD',
      difficulty: 'beginner',
      expectedKeywords: ['continuous integration', 'continuous deployment', 'automation', 'testing', 'delivery'],
      timeLimit: 60
    },
    {
      id: 'do-2',
      text: 'Explain the difference between Docker and virtual machines.',
      category: 'Containerization',
      difficulty: 'intermediate',
      expectedKeywords: ['docker', 'virtual machines', 'containers', 'hypervisor', 'isolation', 'lightweight'],
      timeLimit: 90
    },
    {
      id: 'do-3',
      text: 'How do you monitor application performance and health?',
      category: 'Monitoring',
      difficulty: 'intermediate',
      expectedKeywords: ['monitoring', 'metrics', 'logs', 'alerts', 'prometheus', 'grafana'],
      timeLimit: 90
    },
    {
      id: 'do-4',
      text: 'What is Infrastructure as Code (IaC) and what tools do you use?',
      category: 'IaC',
      difficulty: 'intermediate',
      expectedKeywords: ['infrastructure as code', 'terraform', 'cloudformation', 'ansible', 'automation'],
      timeLimit: 90
    },
    {
      id: 'do-5',
      text: 'How do you handle secrets management in a DevOps environment?',
      category: 'Security',
      difficulty: 'advanced',
      expectedKeywords: ['secrets', 'vault', 'kms', 'environment variables', 'encryption'],
      timeLimit: 120
    },
    {
      id: 'do-6',
      text: 'Explain blue-green deployment and canary deployment strategies.',
      category: 'Deployment',
      difficulty: 'advanced',
      expectedKeywords: ['blue-green', 'canary', 'deployment', 'rollback', 'traffic shifting'],
      timeLimit: 120
    },
    {
      id: 'do-7',
      text: 'What are Kubernetes and how does it help in container orchestration?',
      category: 'Container Orchestration',
      difficulty: 'intermediate',
      expectedKeywords: ['kubernetes', 'orchestration', 'pods', 'services', 'deployments', 'scaling'],
      timeLimit: 90
    },
    {
      id: 'do-8',
      text: 'How do you implement logging and centralized log management?',
      category: 'Logging',
      difficulty: 'intermediate',
      expectedKeywords: ['logging', 'elk stack', 'fluentd', 'centralized', 'aggregation'],
      timeLimit: 90
    }
  ],
  'Full Stack Developer': [
    {
      id: 'fs-1',
      text: 'Explain the MERN stack and its components.',
      category: 'Full Stack',
      difficulty: 'beginner',
      expectedKeywords: ['mern', 'mongodb', 'express', 'react', 'nodejs'],
      timeLimit: 60
    },
    {
      id: 'fs-2',
      text: 'How do you handle authentication across frontend and backend?',
      category: 'Authentication',
      difficulty: 'intermediate',
      expectedKeywords: ['jwt', 'cookies', 'session', 'cors', 'security'],
      timeLimit: 90
    },
    {
      id: 'fs-3',
      text: 'What is server-side rendering (SSR) and when should you use it?',
      category: 'SSR',
      difficulty: 'advanced',
      expectedKeywords: ['ssr', 'seo', 'performance', 'hydration', 'next.js'],
      timeLimit: 120
    },
    {
      id: 'fs-4',
      text: 'How do you optimize both frontend and backend performance?',
      category: 'Performance',
      difficulty: 'advanced',
      expectedKeywords: ['caching', 'compression', 'lazy loading', 'cdn', 'database optimization'],
      timeLimit: 120
    },
    {
      id: 'fs-5',
      text: 'Explain RESTful API design principles.',
      category: 'API Design',
      difficulty: 'intermediate',
      expectedKeywords: ['rest', 'http methods', 'stateless', 'resource', 'endpoints'],
      timeLimit: 90
    }
  ]
};

// Helper function to get questions for a role and difficulty
export function getQuestionsForRole(role: string, difficulty: 'beginner' | 'intermediate' | 'advanced'): Question[] {
  const roleQuestions = questionsBank[role] || [];
  const filteredQuestions = roleQuestions.filter(q => q.difficulty === difficulty);

  // If not enough questions for the specific difficulty, include some from other levels
  if (filteredQuestions.length < 5) {
    const allRoleQuestions = roleQuestions.filter(q =>
      difficulty === 'beginner' ? ['beginner', 'intermediate'].includes(q.difficulty) :
      difficulty === 'advanced' ? ['intermediate', 'advanced'].includes(q.difficulty) :
      ['beginner', 'intermediate', 'advanced'].includes(q.difficulty)
    );
    return allRoleQuestions.slice(0, 8);
  }

  return filteredQuestions.slice(0, 8);
}

// Shuffle array utility
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}