import { useEffect, useMemo, useState } from 'react';
import { Activity, Bot, CheckCircle, Clock, Pause, Play, RotateCcw, Send, XCircle, Zap } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { getQuestionsForRole, shuffleArray, type InterviewSession } from '../lib/questionsData';
import { calculateOverallScore, evaluateAnswer, generateInterviewSummary, type EvaluationResult } from '../lib/interviewEvaluation';
import { getUserProgress, mergeUniqueSkills, upsertUserProgress } from '../lib/database';

const ROLES = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Analyst', 'DevOps Engineer'] as const;

type InterviewPhase = 'setup' | 'interviewing' | 'review' | 'completed';

interface SavedInterview {
  id: string;
  role: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  scores: number[];
  completedAt: string;
}

function storageKey(userId: string): string {
  return `interview_history_${userId}`;
}

function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
}

export default function InterviewSimulator() {
  const { user } = useAuth();

  const [phase, setPhase] = useState<InterviewPhase>('setup');
  const [role, setRole] = useState<string>(ROLES[0]);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');

  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const [showFeedback, setShowFeedback] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationResult | null>(null);
  const [completedSkills, setCompletedSkills] = useState<string[]>([]);

  useEffect(() => {
    const loadProgress = async () => {
      if (!user) return;
      try {
        const progress = await getUserProgress(user.id);
        setCompletedSkills(progress?.completed_skills ?? []);
      } catch (error) {
        console.error(error);
      }
    };

    void loadProgress();
  }, [user]);

  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft]);

  const progressPercentage = useMemo(() => {
    if (!session) return 0;
    return ((session.currentQuestionIndex + (showFeedback ? 1 : 0)) / session.questions.length) * 100;
  }, [session, showFeedback]);

  const startInterview = () => {
    const questions = shuffleArray(getQuestionsForRole(role, difficulty));
    if (questions.length === 0) return;

    const newSession: InterviewSession = {
      id: `interview-${Date.now()}`,
      role,
      difficulty,
      questions,
      answers: new Array(questions.length).fill(''),
      scores: new Array(questions.length).fill(0),
      feedbacks: new Array(questions.length).fill(''),
      suggestions: new Array(questions.length).fill([]),
      startTime: Date.now(),
      currentQuestionIndex: 0,
      isCompleted: false,
      totalScore: 0,
    };

    setSession(newSession);
    setCurrentAnswer('');
    setCurrentEvaluation(null);
    setShowFeedback(false);
    setTimeLeft(questions[0].timeLimit);
    setIsTimerRunning(true);
    setPhase('interviewing');
  };

  const submitAnswer = () => {
    if (!session || !currentAnswer.trim()) return;

    const question = session.questions[session.currentQuestionIndex];
    const evaluation = evaluateAnswer(currentAnswer, question);

    const nextSession: InterviewSession = {
      ...session,
      answers: [...session.answers],
      scores: [...session.scores],
      feedbacks: [...session.feedbacks],
      suggestions: [...session.suggestions],
    };

    nextSession.answers[session.currentQuestionIndex] = currentAnswer;
    nextSession.scores[session.currentQuestionIndex] = evaluation.score;
    nextSession.feedbacks[session.currentQuestionIndex] = evaluation.feedback;
    nextSession.suggestions[session.currentQuestionIndex] = evaluation.suggestions;

    setSession(nextSession);
    setCurrentEvaluation(evaluation);
    setShowFeedback(true);
    setIsTimerRunning(false);
  };

  const persistSession = async (completedSession: InterviewSession) => {
    if (!user) return;

    const highScoringSkills = completedSession.questions
      .filter((_, index) => completedSession.scores[index] >= 70)
      .flatMap((question) => question.expectedKeywords.slice(0, 2));

    const mergedSkills = mergeUniqueSkills(completedSkills, highScoringSkills);
    setCompletedSkills(mergedSkills);

    try {
      await upsertUserProgress({ user_id: user.id, completed_skills: mergedSkills });

      const rawHistory = localStorage.getItem(storageKey(user.id));
      const history = rawHistory ? (JSON.parse(rawHistory) as SavedInterview[]) : [];

      const updatedHistory: SavedInterview[] = [
        {
          id: completedSession.id,
          role: completedSession.role,
          difficulty: completedSession.difficulty,
          scores: completedSession.scores,
          completedAt: new Date().toISOString(),
        },
        ...history,
      ].slice(0, 25);

      localStorage.setItem(storageKey(user.id), JSON.stringify(updatedHistory));
    } catch (error) {
      console.error(error);
    }
  };

  const nextQuestion = async () => {
    if (!session) return;

    const nextIndex = session.currentQuestionIndex + 1;

    if (nextIndex >= session.questions.length) {
      const { totalScore } = calculateOverallScore(session.scores);
      const completedSession: InterviewSession = {
        ...session,
        isCompleted: true,
        totalScore,
      };

      setSession(completedSession);
      setPhase('completed');
      await persistSession(completedSession);
      return;
    }

    const nextSession: InterviewSession = {
      ...session,
      currentQuestionIndex: nextIndex,
    };

    setSession(nextSession);
    setCurrentAnswer('');
    setCurrentEvaluation(null);
    setShowFeedback(false);
    setTimeLeft(nextSession.questions[nextIndex].timeLimit);
    setIsTimerRunning(true);
  };

  const resetInterview = () => {
    setPhase('setup');
    setSession(null);
    setCurrentAnswer('');
    setCurrentEvaluation(null);
    setShowFeedback(false);
    setTimeLeft(0);
    setIsTimerRunning(false);
  };

  if (phase === 'setup') {
    const questionCount = getQuestionsForRole(role, difficulty).length;

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Interview Simulator</h1>
          <p className="text-muted-foreground mt-2">Practice role-based interviews with scoring and actionable feedback.</p>
        </div>

        <div className="glass-panel max-w-2xl mx-auto rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Role</label>
            <select
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="w-full p-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
            >
              {ROLES.map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {roleOption}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Difficulty</label>
            <div className="grid grid-cols-3 gap-2">
              {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`rounded-xl border p-2 capitalize ${difficulty === level ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">
            You will answer {questionCount} timed questions. High-scoring answers update your progress skill graph.
          </div>

          <button
            type="button"
            onClick={startInterview}
            className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'interviewing' && session) {
    const question = session.questions[session.currentQuestionIndex];

    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">{session.role} Interview</h1>
            <p className="text-muted-foreground">
              Question {session.currentQuestionIndex + 1} of {session.questions.length}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm ${
                timeLeft > 30 ? 'bg-green-500/15 text-green-300' : timeLeft > 10 ? 'bg-yellow-500/15 text-yellow-300' : 'bg-red-500/15 text-red-300'
              }`}
            >
              <Clock className="h-4 w-4" />
              {formatTime(timeLeft)}
            </div>
            <button
              type="button"
              onClick={() => setIsTimerRunning((prev) => !prev)}
              className="rounded-lg bg-muted p-2 hover:bg-muted/70"
            >
              {isTimerRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="h-2 rounded-full bg-muted">
          <motion.div className="h-2 rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${progressPercentage}%` }} />
        </div>

        <AnimatePresence mode="wait">
          {!showFeedback ? (
            <motion.div
              key="question"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="glass-panel rounded-2xl p-8 space-y-5"
            >
              <div className="flex gap-3">
                <div className="rounded-full bg-primary/15 p-2 h-fit">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">{question.category}</p>
                  <h2 className="text-xl font-semibold mt-1">{question.text}</h2>
                </div>
              </div>

              <textarea
                value={currentAnswer}
                onChange={(event) => setCurrentAnswer(event.target.value)}
                className="h-48 w-full resize-none rounded-xl border border-border bg-background p-4 outline-none focus:ring-2 focus:ring-primary"
                placeholder="Write your answer..."
                disabled={timeLeft === 0}
              />

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{currentAnswer.split(/\s+/).filter(Boolean).length} words</p>
                <button
                  type="button"
                  onClick={submitAnswer}
                  disabled={!currentAnswer.trim() || timeLeft === 0}
                  className="rounded-xl bg-primary px-5 py-2 font-medium text-primary-foreground disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  Submit
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="feedback" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-2xl p-8 space-y-5">
              {currentEvaluation && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/15 p-3">
                      {currentEvaluation.score >= 70 ? (
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-xl font-semibold">Score: {currentEvaluation.score}/100</p>
                      <p className="text-sm text-muted-foreground">{currentEvaluation.feedback}</p>
                    </div>
                  </div>

                  {currentEvaluation.strengths.length > 0 && (
                    <div>
                      <p className="font-medium text-green-300 mb-2">Strengths</p>
                      <ul className="space-y-1 text-sm">
                        {currentEvaluation.strengths.map((item) => (
                          <li key={item}>- {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentEvaluation.weaknesses.length > 0 && (
                    <div>
                      <p className="font-medium text-red-300 mb-2">Areas to Improve</p>
                      <ul className="space-y-1 text-sm">
                        {currentEvaluation.weaknesses.map((item) => (
                          <li key={item}>- {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentEvaluation.suggestions.length > 0 && (
                    <div>
                      <p className="font-medium text-blue-300 mb-2">Suggestions</p>
                      <ul className="space-y-1 text-sm">
                        {currentEvaluation.suggestions.map((item) => (
                          <li key={item} className="flex items-start gap-2">
                            <Zap className="h-4 w-4 text-blue-400 mt-0.5" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}

              <button
                type="button"
                onClick={() => void nextQuestion()}
                className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground inline-flex items-center justify-center gap-2"
              >
                {session.currentQuestionIndex + 1 === session.questions.length ? 'Finish Interview' : 'Next Question'}
                <Send className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (phase === 'completed' && session) {
    const { averageScore, performance } = calculateOverallScore(session.scores);

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Interview Completed</h1>
          <p className="text-muted-foreground mt-1">
            Overall score {averageScore}% ({performance.replace('_', ' ')})
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="font-semibold mb-3">Question Scores</h2>
            <div className="space-y-2 text-sm">
              {session.scores.map((score, index) => (
                <div key={`score-${index}`} className="flex items-center justify-between">
                  <span>Q{index + 1}</span>
                  <span className={score >= 70 ? 'text-green-300' : 'text-yellow-300'}>{score}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <h2 className="font-semibold mb-3">Progress Updated Skills</h2>
            <div className="flex flex-wrap gap-2">
              {completedSkills.slice(0, 15).map((skill) => (
                <span key={skill} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 flex-col sm:flex-row">
          <button type="button" onClick={resetInterview} className="flex-1 rounded-xl bg-muted py-3 font-medium inline-flex justify-center items-center gap-2">
            <RotateCcw className="h-4 w-4" />
            Start Again
          </button>
          <button
            type="button"
            onClick={() => setPhase('review')}
            className="flex-1 rounded-xl bg-primary py-3 font-medium text-primary-foreground inline-flex justify-center items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Review Summary
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'review' && session) {
    const summary = generateInterviewSummary({
      role: session.role,
      difficulty: session.difficulty,
      questions: session.questions,
      scores: session.scores,
      feedbacks: session.feedbacks,
    });

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Interview Review</h1>
          <p className="text-muted-foreground mt-2">Detailed breakdown and recommendations.</p>
        </div>

        <div className="glass-panel rounded-2xl p-6">
          <pre className="whitespace-pre-wrap text-sm leading-6">{summary}</pre>
        </div>

        <button
          type="button"
          onClick={resetInterview}
          className="w-full rounded-xl bg-primary py-3 font-medium text-primary-foreground inline-flex justify-center items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          New Interview
        </button>
      </div>
    );
  }

  return null;
}
