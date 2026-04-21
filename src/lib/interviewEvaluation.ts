import type { Question } from './questionsData';
import { normalizeSkill } from './skills';

export interface EvaluationResult {
  score: number;
  feedback: string;
  suggestions: string[];
  confidence: number;
  strengths: string[];
  weaknesses: string[];
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function calculateRelevance(answer: string, question: Question): number {
  const answerTokens = new Set(tokenize(answer));
  const questionTokens = new Set(tokenize(question.text));
  if (questionTokens.size === 0) return 0;

  let overlap = 0;
  questionTokens.forEach((token) => {
    if (answerTokens.has(token)) overlap += 1;
  });

  return overlap / questionTokens.size;
}

export function evaluateAnswer(answer: string, question: Question): EvaluationResult {
  const trimmed = answer.trim();
  if (!trimmed) {
    return {
      score: 0,
      feedback: 'No answer provided.',
      suggestions: ['Provide an answer with core concepts, examples, and trade-offs.'],
      confidence: 0,
      strengths: [],
      weaknesses: ['No response submitted'],
    };
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const answerLower = trimmed.toLowerCase();

  const matchedKeywords = question.expectedKeywords.filter((keyword) => {
    const normalizedKeyword = normalizeSkill(keyword);
    return answerLower.includes(normalizedKeyword);
  });

  const keywordCoverage = question.expectedKeywords.length > 0
    ? matchedKeywords.length / question.expectedKeywords.length
    : 0;

  const lengthScore = Math.min(wordCount / 120, 1);
  const relevanceScore = calculateRelevance(trimmed, question);

  const baseScore = Math.round((keywordCoverage * 0.5 + lengthScore * 0.2 + relevanceScore * 0.3) * 100);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  if (keywordCoverage >= 0.7) {
    strengths.push('Strong keyword coverage for the question.');
  } else {
    weaknesses.push('Key concepts are missing from your answer.');
    const missing = question.expectedKeywords.filter((keyword) => !matchedKeywords.includes(keyword)).slice(0, 3);
    if (missing.length > 0) {
      suggestions.push(`Include terms like: ${missing.join(', ')}.`);
    }
  }

  if (wordCount >= 80) {
    strengths.push('Answer has good depth.');
  } else if (wordCount < 35) {
    weaknesses.push('Answer is too short for interview depth.');
    suggestions.push('Expand with a practical example and clear implementation details.');
  }

  if (relevanceScore >= 0.35) {
    strengths.push('Response stays relevant to the prompt.');
  } else {
    weaknesses.push('Some parts are not tightly aligned to the question.');
    suggestions.push('Structure response as: concept, implementation, and trade-offs.');
  }

  const hasExample = /\b(example|for instance|in practice|i built|i implemented)\b/i.test(trimmed);
  if (hasExample) {
    strengths.push('Uses concrete examples.');
  } else {
    suggestions.push('Add one concise real-world example from your experience.');
  }

  const score = Math.max(0, Math.min(100, baseScore + (hasExample ? 6 : 0)));

  const feedback = score >= 85
    ? 'Excellent answer with strong depth and relevance.'
    : score >= 70
      ? 'Good answer with room to tighten key points.'
      : score >= 50
        ? 'Fair answer, but it needs clearer structure and more depth.'
        : 'Answer needs significant improvement on core concepts and relevance.';

  const confidence = Math.min(1, Math.max(0.1, score / 100));

  return {
    score,
    feedback,
    suggestions,
    confidence,
    strengths,
    weaknesses,
  };
}

export function calculateOverallScore(scores: number[]): {
  totalScore: number;
  averageScore: number;
  performance: 'excellent' | 'good' | 'needs_improvement' | 'poor';
} {
  if (scores.length === 0) {
    return { totalScore: 0, averageScore: 0, performance: 'poor' };
  }

  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const averageScore = Math.round(totalScore / scores.length);

  let performance: 'excellent' | 'good' | 'needs_improvement' | 'poor' = 'poor';
  if (averageScore >= 85) performance = 'excellent';
  else if (averageScore >= 70) performance = 'good';
  else if (averageScore >= 50) performance = 'needs_improvement';

  return { totalScore, averageScore, performance };
}

export function generateInterviewSummary(session: {
  role: string;
  difficulty: string;
  questions: Question[];
  scores: number[];
  feedbacks: string[];
}): string {
  const { averageScore, performance } = calculateOverallScore(session.scores);
  const strongAnswers = session.scores.filter((score) => score >= 75).length;
  const weakAnswers = session.scores.filter((score) => score < 60).length;

  return [
    `Interview Summary: ${session.role} (${session.difficulty})`,
    `Overall Score: ${averageScore}% (${performance.replace('_', ' ')})`,
    `Questions Attempted: ${session.questions.length}`,
    `Strong Answers: ${strongAnswers}`,
    `Needs Improvement: ${weakAnswers}`,
    averageScore >= 75
      ? 'Recommendation: Keep practicing advanced scenario and trade-off questions.'
      : 'Recommendation: Focus on fundamentals, structured responses, and practical examples.',
  ].join('\n');
}
