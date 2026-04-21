import { extractSkillsFromText, findMissingSkills, SKILL_LIBRARY } from './skills';

export interface ParsedResume {
  skills: string[];
  education: string[];
  experience: string[];
  suggestions: string[];
}

const EDUCATION_PATTERNS = [
  /\b(bachelor(?:'s)?|b\.tech|btech|b\.e\.?|bs|bsc)\b/gi,
  /\b(master(?:'s)?|m\.tech|mtech|ms|msc|mba)\b/gi,
  /\b(phd|doctorate)\b/gi,
  /\b(university|college|institute|school)\b/gi,
];

const EXPERIENCE_KEYWORDS = [
  'designed',
  'developed',
  'implemented',
  'optimized',
  'led',
  'delivered',
  'deployed',
  'migrated',
  'automated',
  'analyzed',
  'scaled',
  'integrated',
  'collaborated',
];

const HIGH_VALUE_SKILLS = [
  'TypeScript',
  'System Design',
  'Docker',
  'AWS',
  'SQL',
  'Testing',
  'CI/CD',
  'Communication',
];

function collectEducation(text: string): string[] {
  const found = new Set<string>();
  for (const pattern of EDUCATION_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      if (match[0]) found.add(match[0].trim());
    }
  }
  return Array.from(found);
}

function collectExperienceKeywords(text: string): string[] {
  const lower = text.toLowerCase();
  return EXPERIENCE_KEYWORDS.filter((keyword) => lower.includes(keyword));
}

export function buildResumeSuggestions(skills: string[], education: string[], experience: string[]): string[] {
  const suggestions: string[] = [];

  if (skills.length < 8) {
    suggestions.push('Improve by adding more role-specific technical skills and tools.');
  }

  const missingHighValue = findMissingSkills(skills, HIGH_VALUE_SKILLS).slice(0, 3);
  if (missingHighValue.length > 0) {
    suggestions.push(`Improve by adding ${missingHighValue.join(', ')} skill evidence in projects or experience.`);
  }

  if (education.length === 0) {
    suggestions.push('Improve by adding your degree, institution, and graduation timeline.');
  }

  if (experience.length < 5) {
    suggestions.push('Improve by adding quantified impact statements (for example: reduced latency by 30%).');
  }

  if (suggestions.length === 0) {
    suggestions.push('Resume looks strong. Keep tailoring keywords to each job description.');
  }

  return suggestions;
}

export function parseResume(text: string): ParsedResume {
  const normalizedText = text.replace(/\s+/g, ' ').trim();

  const skills = extractSkillsFromText(normalizedText);
  const education = collectEducation(normalizedText);
  const experience = collectExperienceKeywords(normalizedText);
  const suggestions = buildResumeSuggestions(skills, education, experience);

  return {
    skills,
    education,
    experience,
    suggestions,
  };
}

export function parseJobDescriptionSkills(description: string): string[] {
  return extractSkillsFromText(description);
}

export function recommendMissingSkills(resumeSkills: string[], jobSkills: string[], limit = 5): string[] {
  return findMissingSkills(resumeSkills, jobSkills).slice(0, limit);
}

export function calculateResumeScore(parsed: ParsedResume): number {
  const skillCoverage = Math.min(parsed.skills.length / 12, 1) * 50;
  const educationScore = parsed.education.length > 0 ? 20 : 5;
  const experienceScore = Math.min(parsed.experience.length / 8, 1) * 20;

  const qualityBonus = parsed.skills.some((skill) => SKILL_LIBRARY.includes(skill as (typeof SKILL_LIBRARY)[number])) ? 10 : 0;

  return Math.max(0, Math.min(100, Math.round(skillCoverage + educationScore + experienceScore + qualityBonus)));
}
