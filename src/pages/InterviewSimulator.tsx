import { useEffect, useState } from 'react';
import { Mic, Send, Bot, Loader2, Target, Zap, Activity, Clock, CheckCircle, XCircle, RotateCcw, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getQuestionsForRole, shuffleArray, type InterviewSession } from '../lib/questionsData';
import { evaluateAnswer, calculateOverallScore, generateInterviewSummary, type EvaluationResult } from '../lib/interviewEvaluation';

type InterviewPhase = 'setup' | 'interviewing' | 'review' | 'completed';

export default function InterviewSimulator() {
  const [phase, setPhase] = useState<InterviewPhase>('setup');
  const [role, setRole] = useState('Frontend Developer');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState<EvaluationResult | null>(null);

  const roles = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'Data Analyst',
    'DevOps Engineer'
  ];

  const startInterview = () => {
    const questions = shuffleArray(getQuestionsForRole(role, difficulty));
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
      totalScore: 0
    };

    setSession(newSession);
    setPhase('interviewing');
    setTimeLeft(questions[0]?.timeLimit ?? 90);
    setIsTimerRunning(true);
    setCurrentAnswer('');
    setShowFeedback(false);
    setCurrentEvaluation(null);
  };

  const submitAnswer = () => {
    if (!session || !currentAnswer.trim()) return;

    const currentQuestion = session.questions[session.currentQuestionIndex];
    const evaluation = evaluateAnswer(currentAnswer, currentQuestion);

    const updatedSession: InterviewSession = {
      ...session,
      answers: [...session.answers],
      scores: [...session.scores],
      feedbacks: [...session.feedbacks],
      suggestions: [...session.suggestions]
    };

    updatedSession.answers[session.currentQuestionIndex] = currentAnswer;
    updatedSession.scores[session.currentQuestionIndex] = evaluation.score;
    updatedSession.feedbacks[session.currentQuestionIndex] = evaluation.feedback;
    updatedSession.suggestions[session.currentQuestionIndex] = evaluation.suggestions;

    setCurrentEvaluation(evaluation);
    setShowFeedback(true);
    setIsTimerRunning(false);
    setSession(updatedSession);
  };

  const nextQuestion = () => {
    if (!session) return;

    const nextIndex = session.currentQuestionIndex + 1;
    const updatedSession = { ...session };

    if (nextIndex >= session.questions.length) {
      const { totalScore } = calculateOverallScore(session.scores);
      updatedSession.isCompleted = true;
      updatedSession.totalScore = totalScore;
      setSession(updatedSession);
      setPhase('completed');
      return;
    }

    updatedSession.currentQuestionIndex = nextIndex;
    setSession(updatedSession);
    setCurrentAnswer('');
    setShowFeedback(false);
    setCurrentEvaluation(null);
    setTimeLeft(session.questions[nextIndex].timeLimit);
    setIsTimerRunning(true);
  };

  const restartInterview = () => {
    setPhase('setup');
    setSession(null);
    setCurrentAnswer('');
    setTimeLeft(0);
    setIsTimerRunning(false);
    setShowFeedback(false);
    setCurrentEvaluation(null);
  };

  const toggleTimer = () => {
    setIsTimerRunning((prev) => !prev);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          if (time <= 1) {
            setIsTimerRunning(false);
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (!session) return 0;
    return ((session.currentQuestionIndex + (showFeedback ? 1 : 0)) / session.questions.length) * 100;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-500';
    if (confidence >= 0.6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (phase === 'setup') {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">AI Interview Simulator</h1>
          <p className="text-muted-foreground text-lg">Practice technical interviews with instant AI feedback.</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 rounded-2xl max-w-2xl mx-auto">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">Select Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full p-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none">
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-3">Experience Level</label>
              <div className="grid grid-cols-3 gap-3">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <button key={level} type="button" onClick={() => setDifficulty(level)} className={`p-4 rounded-xl border-2 transition-all capitalize ${difficulty === level ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'}`}>
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-muted/30 p-4 rounded-xl">
              <h3 className="font-semibold mb-2">Interview Details</h3>
              <p className="text-sm text-muted-foreground">You will answer {getQuestionsForRole(role, difficulty).length} questions at the {difficulty} level. Each question includes a timer and AI-powered scoring.</p>
            </div>

            <button type="button" onClick={startInterview} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              Start Interview
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (phase === 'interviewing' && session) {
    const currentQuestion = session.questions[session.currentQuestionIndex];
    const isTimeUp = timeLeft === 0 && !showFeedback;

    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{session.role} Interview</h1>
            <p className="text-muted-foreground">Question {session.currentQuestionIndex + 1} of {session.questions.length}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${timeLeft > 30 ? 'bg-green-500/20 text-green-400' : timeLeft > 10 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
              <Clock className="w-4 h-4" />
              {formatTime(timeLeft)}
            </div>
            <button type="button" onClick={toggleTimer} className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
              {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="w-full bg-muted rounded-full h-2">
          <motion.div className="bg-primary h-2 rounded-full" initial={{ width: 0 }} animate={{ width: `${getProgressPercentage()}%` }} transition={{ duration: 0.5 }} />
        </div>

        <AnimatePresence mode="wait">
          {!showFeedback ? (
            <motion.div key="question" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="glass-panel p-8 rounded-2xl">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">{currentQuestion.category}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${currentQuestion.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' : currentQuestion.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        {currentQuestion.difficulty}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold leading-relaxed">{currentQuestion.text}</h2>
                  </div>
                </div>

                <textarea value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} placeholder="Type your answer here..." disabled={isTimeUp} className="w-full h-48 p-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none disabled:opacity-50" />

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
                  <div className="text-sm text-muted-foreground">{currentAnswer.split(/\s+/).filter((word) => word.length > 0).length} words</div>
                  <button type="button" onClick={submitAnswer} disabled={!currentAnswer.trim() || isTimeUp} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit Answer
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="feedback" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="glass-panel p-8 rounded-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${currentEvaluation!.score >= 80 ? 'bg-green-500/20' : currentEvaluation!.score >= 60 ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                    {currentEvaluation!.score >= 80 ? <CheckCircle className="w-6 h-6 text-green-500" /> : currentEvaluation!.score >= 60 ? <Target className="w-6 h-6 text-yellow-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-2xl font-bold">Score: {currentEvaluation!.score}/100</h3>
                      <div className={`w-3 h-3 rounded-full ${getConfidenceColor(currentEvaluation!.confidence)}`} />
                    </div>
                    <p className="text-muted-foreground">{currentEvaluation!.feedback}</p>
                  </div>
                </div>

                {currentEvaluation!.strengths.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-green-400 mb-2">Strengths</h4>
                    <ul className="space-y-1">
                      {currentEvaluation!.strengths.map((strength, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" />{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentEvaluation!.weaknesses.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-red-400 mb-2">Areas for Improvement</h4>
                    <ul className="space-y-1">
                      {currentEvaluation!.weaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm"><XCircle className="w-4 h-4 text-red-500" />{weakness}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentEvaluation!.suggestions.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-semibold text-blue-400 mb-2">Suggestions</h4>
                    <ul className="space-y-1">
                      {currentEvaluation!.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm"><Zap className="w-4 h-4 text-blue-500" />{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button type="button" onClick={nextQuestion} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  {session.currentQuestionIndex + 1 >= session.questions.length ? 'Complete Interview' : 'Next Question'}
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (phase === 'completed' && session) {
    const { averageScore, performance } = calculateOverallScore(session.scores);
    const summary = generateInterviewSummary({ role: session.role, difficulty: session.difficulty, questions: session.questions, scores: session.scores, feedbacks: session.feedbacks });

    return (
      <div className="space-y-8">
        <div className="text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 ${performance === 'excellent' ? 'bg-green-500/20' : performance === 'good' ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
            {performance === 'excellent' ? <CheckCircle className="w-12 h-12 text-green-500" /> : performance === 'good' ? <Target className="w-12 h-12 text-yellow-500" /> : <XCircle className="w-12 h-12 text-red-500" />}
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Interview Completed!</h1>
          <p className="text-muted-foreground">Here’s your performance summary</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4">Overall Score</h3>
            <div className="text-center">
              <div className={`text-6xl font-bold mb-2 ${getScoreColor(averageScore)}`}>{averageScore}%</div>
              <p className="text-muted-foreground capitalize">{performance.replace('_', ' ')}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-4">Question Breakdown</h3>
            <div className="space-y-3">
              {session.questions.map((question, index) => (
                <div key={question.id} className="flex items-center justify-between">
                  <span className="text-sm">Q{index + 1}</span>
                  <span className={`font-bold ${getScoreColor(session.scores[index])}`}>{session.scores[index]}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }} className="glass-panel p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-4">Detailed Feedback</h3>
          <div className="space-y-6">
            {session.questions.map((question, index) => (
              <div key={question.id} className="border-b border-border pb-6 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Question {index + 1}</h4>
                  <span className={`font-bold ${getScoreColor(session.scores[index])}`}>{session.scores[index]}%</span>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{question.text}</p>
                <p className="text-sm">{session.feedbacks[index]}</p>
                {session.suggestions[index].length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {session.suggestions[index].map((suggestion, suggestionIndex) => (
                      <li key={suggestionIndex} className="text-sm text-blue-400 flex items-center gap-2"><Zap className="w-3 h-3" />{suggestion}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-4">
          <button type="button" onClick={restartInterview} className="flex-1 py-3 bg-muted text-foreground rounded-xl font-bold hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"><RotateCcw className="w-4 h-4" /> Take Another Interview</button>
          <button type="button" onClick={() => setPhase('review')} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"><Activity className="w-4 h-4" /> Review Summary</button>
        </div>
      </div>
    );
  }

  if (phase === 'review' && session) {
    const summary = generateInterviewSummary({ role: session.role, difficulty: session.difficulty, questions: session.questions, scores: session.scores, feedbacks: session.feedbacks });

    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Interview Review</h1>
          <p className="text-muted-foreground">Detailed analysis of your performance</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-6 rounded-2xl">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">{summary}</pre>
        </motion.div>

        <button type="button" onClick={restartInterview} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"><RotateCcw className="w-4 h-4" /> Start New Interview</button>
      </div>
    );
  }

  return null;
}
