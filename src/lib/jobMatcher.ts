import { dedupeSkills, findMissingSkills, normalizeSkill } from './skills';

export interface Job {
  id: string;
  title: string;
  company: string;
  required_skills: string[];
  description: string;
  location?: string;
  type?: string;
  url?: string;
}

export interface MatchResult {
  job: Job;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export function calculateMatch(
  userSkills: string[],
  jobSkills: string[],
): {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
} {
  const uniqueUserSkills = dedupeSkills(userSkills);
  const userSkillSet = new Set(uniqueUserSkills.map((skill) => normalizeSkill(skill)));

  const matchedSkills = dedupeSkills(jobSkills).filter((skill) => userSkillSet.has(normalizeSkill(skill)));
  const missingSkills = findMissingSkills(uniqueUserSkills, jobSkills);

  const score = jobSkills.length > 0 ? Math.round((matchedSkills.length / jobSkills.length) * 100) : 0;

  return {
    score,
    matchedSkills,
    missingSkills,
  };
}

export function matchJobs(userSkills: string[], jobs: Job[], limit = 8): MatchResult[] {
  const normalizedSkills = dedupeSkills(userSkills);

  const ranked = jobs
    .map((job) => {
      const { score, matchedSkills, missingSkills } = calculateMatch(normalizedSkills, job.required_skills);
      return {
        job,
        score,
        matchedSkills,
        missingSkills,
      };
    })
    .sort((a, b) => b.score - a.score || b.matchedSkills.length - a.matchedSkills.length);

  return ranked.slice(0, limit);
}

export function generateSkillSuggestions(userSkills: string[], jobSkills: string[]): string[] {
  const missing = findMissingSkills(userSkills, jobSkills);

  if (missing.length === 0) {
    return ['Your current skills are a strong fit for this role.'];
  }

  return [
    `Improve by adding ${missing[0]} skill through a focused project.`,
    missing[1] ? `Improve by adding ${missing[1]} skill and showcasing it in your resume.` : 'Strengthen your resume with measurable outcomes tied to your skills.',
    'Tailor your resume bullets to directly match role requirements.',
  ].filter(Boolean);
}
