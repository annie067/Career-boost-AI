// src/lib/interviewEvaluation.ts
import type { Question } from './questionsData';

export interface EvaluationResult {
  score: number;
  feedback: string;
  suggestions: string[];
  confidence: number;
  strengths: string[];
  weaknesses: string[];
}

export function evaluateAnswer(answer: string, question: Question): EvaluationResult {
  if (!answer.trim()) {
    return {
      score: 0,
      feedback: 'No answer provided. Please provide a detailed response to demonstrate your knowledge.',
      suggestions: ['Take your time to think through the question', 'Provide specific examples', 'Explain concepts clearly'],
      confidence: 0,
      strengths: [],
      weaknesses: ['No response provided']
    };
  }

  const answerLower = answer.toLowerCase();
  const wordCount = answer.split(/\s+/).length;
  let score = 0;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];

  // Length check
  if (wordCount < 20) {
    weaknesses.push('Answer is too brief');
    suggestions.push('Provide more detailed explanations');
    score -= 20;
  } else if (wordCount > 50) {
    strengths.push('Detailed response provided');
    score += 10;
  }

  // Keyword matching
  const matchedKeywords = question.expectedKeywords.filter(keyword =>
    answerLower.includes(keyword.toLowerCase())
  );

  const keywordScore = (matchedKeywords.length / question.expectedKeywords.length) * 60;
  score += keywordScore;

  if (matchedKeywords.length > 0) {
    strengths.push(`Covered ${matchedKeywords.length} key concepts`);
  }

  if (matchedKeywords.length < question.expectedKeywords.length * 0.5) {
    weaknesses.push('Missing key concepts');
    suggestions.push(`Consider mentioning: ${question.expectedKeywords.slice(0, 3).join(', ')}`);
  }

  // Clarity and structure check
  const hasStructure = /\b(because|however|therefore|for example|such as)\b/i.test(answer);
  if (hasStructure) {
    strengths.push('Well-structured response');
    score += 10;
  } else {
    suggestions.push('Use transition words to improve clarity');
  }

  // Technical depth check
  const hasExamples = /\b(for example|such as|like|instance)\b/i.test(answer);
  if (hasExamples) {
    strengths.push('Includes practical examples');
    score += 10;
  } else {
    suggestions.push('Include specific examples to support your points');
  }

  // Grammar and professionalism check
  const hasProfessionalTone = !/\b(um|uh|like|you know)\b/i.test(answer);
  if (hasProfessionalTone) {
    score += 5;
  } else {
    suggestions.push('Use more professional language');
  }

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Confidence calculation based on answer characteristics
  let confidence = 0.5; // Base confidence
  if (wordCount > 30) confidence += 0.2;
  if (matchedKeywords.length > question.expectedKeywords.length * 0.7) confidence += 0.2;
  if (hasStructure && hasExamples) confidence += 0.1;
  confidence = Math.min(1, confidence);

  // Generate feedback based on score
  let feedback = '';
  if (score >= 80) {
    feedback = 'Excellent answer! You demonstrated strong knowledge and clear communication skills.';
  } else if (score >= 60) {
    feedback = 'Good answer with solid understanding. Some areas could be expanded upon.';
  } else if (score >= 40) {
    feedback = 'Basic understanding shown, but the answer needs more depth and detail.';
  } else {
    feedback = 'The answer needs significant improvement. Consider studying the topic more thoroughly.';
  }

  // Add specific feedback based on question difficulty
  if (question.difficulty === 'advanced' && score < 70) {
    suggestions.push('For advanced questions, focus on architectural decisions and trade-offs');
  }

  if (question.difficulty === 'beginner' && score < 50) {
    suggestions.push('Review fundamental concepts before moving to complex topics');
  }

  return {
    score,
    feedback,
    suggestions,
    confidence,
    strengths,
    weaknesses
  };
}

export function calculateOverallScore(scores: number[]): {
  totalScore: number;
  averageScore: number;
  performance: 'excellent' | 'good' | 'needs_improvement' | 'poor';
} {
  if (scores.length === 0) return { totalScore: 0, averageScore: 0, performance: 'poor' };

  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const averageScore = Math.round(totalScore / scores.length);

  let performance: 'excellent' | 'good' | 'needs_improvement' | 'poor';
  if (averageScore >= 80) performance = 'excellent';
  else if (averageScore >= 65) performance = 'good';
  else if (averageScore >= 50) performance = 'needs_improvement';
  else performance = 'poor';

  return { totalScore, averageScore, performance };
}

export function generateInterviewSummary(
  session: {
    role: string;
    difficulty: string;
    questions: Question[];
    scores: number[];
    feedbacks: string[];
  }
): string {
  const { averageScore, performance } = calculateOverallScore(session.scores);

  const summary = `
Interview Summary for ${session.role} (${session.difficulty})

Overall Performance: ${performance.toUpperCase()} (${averageScore}%)
Questions Answered: ${session.scores.length}

Key Insights:
${session.scores.filter(score => score >= 80).length} excellent answers
${session.scores.filter(score => score >= 60 && score < 80).length} good answers
${session.scores.filter(score => score < 60).length} answers needing improvement

Recommendations:
${performance === 'excellent' ? 'You\'re well-prepared for this role!' :
  performance === 'good' ? 'Solid foundation with room for growth in specific areas.' :
  'Focus on strengthening core concepts and practice more interview questions.'}
  `.trim();

  return summary;
}