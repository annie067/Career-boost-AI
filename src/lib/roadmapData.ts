import { findMissingSkills, normalizeSkill } from './skills';

export interface RoadmapStep {
  title: string;
  description: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  completed: boolean;
  relatedSkill?: string;
  resources?: string[];
}

export interface RoleRoadmap {
  role: string;
  required_skills: string[];
  roadmap: {
    beginner: string[];
    intermediate: string[];
    advanced: string[];
  };
}

export const roadmaps: Record<string, RoleRoadmap> = {
  'Frontend Developer': {
    role: 'Frontend Developer',
    required_skills: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Testing', 'Accessibility', 'Git', 'Performance'],
    roadmap: {
      beginner: ['Master semantic HTML and modern CSS layouts', 'Learn core JavaScript and DOM APIs', 'Build responsive UIs with mobile-first design'],
      intermediate: ['Build reusable React components and state flows', 'Adopt TypeScript for safer UI code', 'Add test coverage with unit and integration tests'],
      advanced: ['Optimize Core Web Vitals in production', 'Design scalable frontend architecture', 'Build and maintain a design system'],
    },
  },
  'Backend Developer': {
    role: 'Backend Developer',
    required_skills: ['Node.js', 'Express', 'SQL', 'PostgreSQL', 'Authentication', 'System Design', 'Docker', 'Testing', 'API Design'],
    roadmap: {
      beginner: ['Build CRUD APIs with input validation', 'Understand relational modeling and SQL basics', 'Implement auth and role checks'],
      intermediate: ['Design versioned REST APIs and error contracts', 'Write integration tests and monitor API reliability', 'Containerize services with Docker'],
      advanced: ['Design distributed systems and caching strategies', 'Handle migrations with zero downtime patterns', 'Improve observability with logs, metrics, traces'],
    },
  },
  'Full Stack Developer': {
    role: 'Full Stack Developer',
    required_skills: ['React', 'TypeScript', 'Node.js', 'Express', 'SQL', 'API Design', 'Testing', 'Docker', 'System Design'],
    roadmap: {
      beginner: ['Build end-to-end apps with frontend + backend basics', 'Learn database CRUD and API integrations', 'Deploy a full-stack project to production'],
      intermediate: ['Share types/contracts between frontend and backend', 'Add authentication and protected routes', 'Set up CI pipelines with testing gates'],
      advanced: ['Scale architecture with caching and background jobs', 'Implement robust monitoring and incident handling', 'Lead cross-functional feature delivery from design to release'],
    },
  },
  'Data Analyst': {
    role: 'Data Analyst',
    required_skills: ['SQL', 'Python', 'Pandas', 'Statistics', 'Data Visualization', 'Tableau', 'Excel', 'Communication'],
    roadmap: {
      beginner: ['Write SQL queries for filtering and aggregations', 'Use spreadsheets for fast exploratory analysis', 'Learn descriptive statistics and basic probability'],
      intermediate: ['Analyze datasets using Python and Pandas', 'Build dashboards with business-ready metrics', 'Run and interpret A/B tests'],
      advanced: ['Design automated reporting pipelines', 'Develop predictive analytics workflows', 'Present insights with clear recommendations and impact'],
    },
  },
  'DevOps Engineer': {
    role: 'DevOps Engineer',
    required_skills: ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform', 'Monitoring', 'Security'],
    roadmap: {
      beginner: ['Master Linux and shell scripting fundamentals', 'Build CI pipelines for automated testing and deploys', 'Containerize services with Docker'],
      intermediate: ['Manage Kubernetes deployments and scaling', 'Provision cloud infrastructure with Terraform', 'Implement centralized logs and metrics dashboards'],
      advanced: ['Set SLO/SLI with error-budget-based operations', 'Design reliable disaster recovery workflows', 'Automate security checks in delivery pipelines'],
    },
  },
};

export function generateRoadmap(
  targetRole: string,
  userSkills: string[],
  completedSkills: string[] = [],
): { steps: RoadmapStep[]; matchPercentage: number; missingSkills: string[] } {
  const roleRoadmap = roadmaps[targetRole];
  if (!roleRoadmap) {
    return { steps: [], matchPercentage: 0, missingSkills: [] };
  }

  const normalizedUserSkills = new Set(userSkills.map((skill) => normalizeSkill(skill)));
  const matched = roleRoadmap.required_skills.filter((skill) => normalizedUserSkills.has(normalizeSkill(skill)));
  const matchPercentage = Math.round((matched.length / roleRoadmap.required_skills.length) * 100);

  const missingSkills = findMissingSkills(userSkills, roleRoadmap.required_skills);
  const completedSet = new Set(completedSkills.map((skill) => normalizeSkill(skill)));

  const steps: RoadmapStep[] = [
    ...roleRoadmap.roadmap.beginner.map((title) => ({
      title,
      description: title,
      level: 'beginner' as const,
      relatedSkill: roleRoadmap.required_skills.find((skill) => title.toLowerCase().includes(skill.toLowerCase())),
    })),
    ...roleRoadmap.roadmap.intermediate.map((title) => ({
      title,
      description: title,
      level: 'intermediate' as const,
      relatedSkill: roleRoadmap.required_skills.find((skill) => title.toLowerCase().includes(skill.toLowerCase())),
    })),
    ...roleRoadmap.roadmap.advanced.map((title) => ({
      title,
      description: title,
      level: 'advanced' as const,
      relatedSkill: roleRoadmap.required_skills.find((skill) => title.toLowerCase().includes(skill.toLowerCase())),
    })),
  ].map((step) => ({
    ...step,
    completed: step.relatedSkill ? completedSet.has(normalizeSkill(step.relatedSkill)) : false,
  }));

  return { steps, matchPercentage, missingSkills };
}
