// src/lib/jobMatcher.ts

export interface Job {
  id: number;
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

// Extract skills from resume text using basic keyword matching
export function extractSkillsFromResume(resumeText: string): string[] {
  const skillKeywords = [
    // Programming Languages
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
    // Web Technologies
    'react', 'vue', 'angular', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel', 'html', 'css', 'sass', 'tailwind',
    // Databases
    'mysql', 'postgresql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'github actions', 'terraform', 'ansible',
    // Tools & Frameworks
    'git', 'webpack', 'babel', 'eslint', 'prettier', 'jest', 'mocha', 'cypress', 'selenium',
    // Data Science & ML
    'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'jupyter', 'matplotlib', 'seaborn',
    // Mobile
    'react native', 'flutter', 'ios', 'android', 'xamarin',
    // Other
    'agile', 'scrum', 'kanban', 'ci/cd', 'microservices', 'rest api', 'graphql', 'oauth', 'jwt'
  ];

  const text = resumeText.toLowerCase();
  const foundSkills = skillKeywords.filter(skill =>
    text.includes(skill.toLowerCase())
  );

  // Remove duplicates and return
  return Array.from(new Set(foundSkills));
}

// Calculate match score and details
export function calculateMatch(userSkills: string[], jobSkills: string[]): {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
} {
  const userSkillsLower = userSkills.map(s => s.toLowerCase());

  const matchedSkills = jobSkills.filter(skill =>
    userSkillsLower.includes(skill.toLowerCase())
  );

  const missingSkills = jobSkills.filter(skill =>
    !userSkillsLower.includes(skill.toLowerCase())
  );

  const score = jobSkills.length > 0 ? Math.round((matchedSkills.length / jobSkills.length) * 100) : 0;

  return {
    score,
    matchedSkills,
    missingSkills
  };
}

// Main matching function
export function matchJobs(userSkills: string[], jobs: Job[], limit: number = 5): MatchResult[] {
  const results: MatchResult[] = jobs.map(job => {
    const { score, matchedSkills, missingSkills } = calculateMatch(userSkills, job.required_skills);
    return {
      job,
      score,
      matchedSkills,
      missingSkills
    };
  });

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  // Return top matches
  return results.slice(0, limit);
}

// Optional: Enhanced skill extraction using OpenAI (placeholder)
export async function extractSkillsWithAI(resumeText: string): Promise<string[]> {
  // This would integrate with OpenAI API
  // For now, return basic extraction
  return extractSkillsFromResume(resumeText);
}

// Generate skill improvement suggestions
export function generateSkillSuggestions(userSkills: string[], jobSkills: string[]): string[] {
  const missingSkills = jobSkills.filter(skill =>
    !userSkills.map(s => s.toLowerCase()).includes(skill.toLowerCase())
  );

  if (missingSkills.length === 0) {
    return ['Your skills are a great match for this role!'];
  }

  const suggestions = [
    `Consider learning: ${missingSkills.slice(0, 3).join(', ')}`,
    'Focus on gaining experience with the missing technologies',
    'Take online courses or certifications for the required skills'
  ];

  return suggestions;
}