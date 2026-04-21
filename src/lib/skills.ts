export const SKILL_LIBRARY = [
  'JavaScript', 'TypeScript', 'React', 'Next.js', 'Vue', 'Angular', 'HTML', 'CSS', 'Sass', 'Tailwind CSS',
  'Node.js', 'Express', 'NestJS', 'Python', 'Django', 'Flask', 'FastAPI', 'Java', 'Spring Boot', 'C#', '.NET',
  'Go', 'Rust', 'PHP', 'Laravel', 'Ruby', 'Rails', 'SQL', 'PostgreSQL', 'MySQL', 'SQLite', 'MongoDB', 'Redis',
  'Firebase', 'Supabase', 'GraphQL', 'REST API', 'gRPC', 'Docker', 'Kubernetes', 'Terraform', 'AWS', 'Azure',
  'GCP', 'CI/CD', 'GitHub Actions', 'Jenkins', 'Linux', 'Bash', 'Git', 'System Design', 'Microservices',
  'Unit Testing', 'Integration Testing', 'Jest', 'Cypress', 'Playwright', 'Selenium', 'Figma', 'UI/UX',
  'React Native', 'Flutter', 'Android', 'iOS', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'PyTorch',
  'Tableau', 'Power BI', 'Excel', 'Data Analysis', 'Statistics', 'Machine Learning', 'Agile', 'Scrum',
  'Problem Solving', 'Communication', 'Leadership'
] as const;

const NORMALIZED_SKILL_MAP = new Map<string, string>(
  SKILL_LIBRARY.map((skill) => [normalizeSkill(skill), skill]),
);

const SPECIAL_PATTERN_OVERRIDES: Record<string, RegExp> = {
  'c#': /(^|[^a-z0-9])c#($|[^a-z0-9])/i,
  'c++': /(^|[^a-z0-9])c\+\+($|[^a-z0-9])/i,
  'node.js': /\bnode\.?js\b/i,
  'next.js': /\bnext\.?js\b/i,
  '.net': /(^|[^a-z0-9])\.net($|[^a-z0-9])/i,
  'ci/cd': /\bci\/?cd\b/i,
  'rest api': /\brest(?:ful)?\s+api\b/i,
  'ui/ux': /\bui\s*\/\s*ux\b/i,
};

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeSkill(skill: string): string {
  return skill
    .toLowerCase()
    .replace(/[^a-z0-9+#./ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function canonicalizeSkill(skill: string): string {
  const normalized = normalizeSkill(skill);
  return NORMALIZED_SKILL_MAP.get(normalized) ?? skill.trim();
}

export function dedupeSkills(skills: string[]): string[] {
  const seen = new Set<string>();
  const ordered: string[] = [];

  for (const skill of skills) {
    const canonical = canonicalizeSkill(skill);
    const normalized = normalizeSkill(canonical);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    ordered.push(canonical);
  }

  return ordered;
}

function getSkillPattern(skill: string): RegExp {
  const normalized = normalizeSkill(skill);
  if (SPECIAL_PATTERN_OVERRIDES[normalized]) {
    return SPECIAL_PATTERN_OVERRIDES[normalized];
  }

  const escaped = escapeRegExp(skill).replace(/\s+/g, '\\s+');
  return new RegExp(`(^|[^a-z0-9+#.])${escaped}($|[^a-z0-9+#.])`, 'i');
}

export function extractSkillsFromText(text: string): string[] {
  if (!text.trim()) return [];

  const found: string[] = [];
  for (const skill of SKILL_LIBRARY) {
    if (getSkillPattern(skill).test(text)) {
      found.push(skill);
    }
  }

  return dedupeSkills(found);
}

export function findMissingSkills(currentSkills: string[], requiredSkills: string[]): string[] {
  const current = new Set(currentSkills.map((skill) => normalizeSkill(skill)));
  return dedupeSkills(requiredSkills).filter((skill) => !current.has(normalizeSkill(skill)));
}
