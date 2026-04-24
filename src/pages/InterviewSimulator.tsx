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
              <label className="block text-sm font-semibold mb-3 text-foreground">Target Role</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roles.map((r: string) => (
                  <button key={r} type="button" onClick={() => setRole(r)} className={`p-4 rounded-xl border-2 transition-all text-left ${role === r ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-border/50 hover:border-blue-500/50 hover:bg-muted/50'}`}>
                    <span className="font-medium">{r}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3 text-foreground">Experience Level</label>
              <div className="grid grid-cols-3 gap-3">
                {(['beginner', 'intermediate', 'advanced'] as const).map((level) => (
                  <button key={level} type="button" onClick={() => setDifficulty(level)} className={`p-4 rounded-xl border-2 transition-all capitalize ${difficulty === level ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-border/50 hover:border-blue-500/50 hover:bg-muted/50'}`}>
                    <span className="font-medium">{level}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-5 rounded-xl border border-blue-500/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-400" />
                </div>
                <h3 className="font-semibold text-foreground">Interview Preview</h3>
              </div>
              <p className="text-sm text-muted-foreground">{getQuestionsForRole(role, difficulty).length} questions • {difficulty} level • {Math.round(getQuestionsForRole(role, difficulty).reduce((acc, q) => acc + q.timeLimit, 0) / 60)} min total</p>
            </div>

            <button type="button" onClick={startInterview} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
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
        {/* Professional Interview Header */}
        <div className="bg-card border border-border/50 rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{session.role}</h1>
                <p className="text-sm text-muted-foreground">Technical Interview • {session.difficulty}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* Recording Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-medium text-red-400">REC</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-sm font-bold ${timeLeft > 30 ? 'bg-green-500/20 text-green-400' : timeLeft > 10 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                <Clock className="w-4 h-4" />
                {formatTime(timeLeft)}
              </div>
              <button type="button" onClick={toggleTimer} className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Question {session.currentQuestionIndex + 1} of {session.questions.length}</span>
              <span>{Math.round(getProgressPercentage())}% complete</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <motion.div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full" initial={{ width: 0 }} animate={{ width: `${getProgressPercentage()}%` }} transition={{ duration: 0.5 }} />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!showFeedback ? (
            <motion.div key="question" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="bg-card border border-border/50 p-6 rounded-2xl shadow-xl">
                <div className="flex items-start gap-5 mb-6">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bot className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted px-2 py-1 rounded">{currentQuestion.category}</span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-semibold ${currentQuestion.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' : currentQuestion.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400'}`}>
                        {currentQuestion.difficulty}
                      </span>
                    </div>
                    <h2 className="text-xl font-semibold leading-relaxed text-foreground">{currentQuestion.text}</h2>
                  </div>
                </div>

                <div className="relative">
                  <textarea value={currentAnswer} onChange={(e) => setCurrentAnswer(e.target.value)} placeholder="Type your answer here... Take your time to structure a clear response." disabled={isTimeUp} className="w-full h-56 p-5 bg-muted/30 border border-border/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none disabled:opacity-50 text-foreground placeholder:text-muted-foreground/50" />
                  
                  {/* Character/Word count */}
                  <div className="absolute bottom-3 right-3 text-xs text-muted-foreground bg-card px-2 py-1 rounded">
                    {currentAnswer.split(/\s+/).filter((word) => word.length > 0).length} words
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6">
                  <div className="flex items-center gap-3">
                    <button type="button" className="p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-muted-foreground" title="Voice input (coming soon)">
                      <Mic className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-muted-foreground">Voice input coming soon</span>
                  </div>
                  <button type="button" onClick={submitAnswer} disabled={!currentAnswer.trim() || isTimeUp} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg">
                    <Send className="w-4 h-4" />
                    Submit Answer
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="feedback" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="bg-card border border-border/50 p-6 rounded-2xl shadow-xl">
                <div className="flex items-center gap-5 mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${currentEvaluation!.score >= 80 ? 'bg-green-500/20' : currentEvaluation!.score >= 60 ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                    {currentEvaluation!.score >= 80 ? <CheckCircle className="w-7 h-7 text-green-500" /> : currentEvaluation!.score >= 60 ? <Target className="w-7 h-7 text-yellow-500" /> : <XCircle className="w-7 h-7 text-red-500" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-2xl font-bold text-foreground">Score: {currentEvaluation!.score}/100</h3>
                      <div className={`w-3 h-3 rounded-full ${getConfidenceColor(currentEvaluation!.confidence)}`} />
                    </div>
                    <p className="text-muted-foreground">{currentEvaluation!.feedback}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {currentEvaluation!.strengths.length > 0 && (
                    <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/20">
                      <h4 className="font-semibold text-green-400 mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Strengths</h4>
                      <ul className="space-y-2">
                        {currentEvaluation!.strengths.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-foreground"><span className="text-green-500 mt-0.5">•</span>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentEvaluation!.weaknesses.length > 0 && (
                    <div className="bg-red-500/5 p-4 rounded-xl border border-red-500/20">
                      <h4 className="font-semibold text-red-400 mb-3 flex items-center gap-2"><XCircle className="w-4 h-4" /> Areas for Improvement</h4>
                      <ul className="space-y-2">
                        {currentEvaluation!.weaknesses.map((weakness, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-foreground"><span className="text-red-500 mt-0.5">•</span>{weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {currentEvaluation!.suggestions.length > 0 && (
                  <div className="mt-6 bg-blue-500/5 p-4 rounded-xl border border-blue-500/20">
                    <h4 className="font-semibold text-blue-400 mb-3 flex items-center gap-2"><Zap className="w-4 h-4" /> Suggestions for Better Answers</h4>
                    <ul className="space-y-2">
                      {currentEvaluation!.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-foreground"><span className="text-blue-500 mt-0.5">•</span>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button type="button" onClick={nextQuestion} className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg">
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
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`w-28 h-28 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl ${performance === 'excellent' ? 'bg-green-500/20' : performance === 'good' ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
            {performance === 'excellent' ? <CheckCircle className="w-14 h-14 text-green-500" /> : performance === 'good' ? <Target className="w-14 h-14 text-yellow-500" /> : <XCircle className="w-14 h-14 text-red-500" />}
          </motion.div>
          <h1 className="text-3xl font-bold mb-3 text-foreground">Interview Completed!</h1>
          <p className="text-muted-foreground text-lg">Here's your performance summary</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border/50 p-6 rounded-2xl shadow-xl">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-blue-400" /> Overall Score</h3>
            <div className="text-center py-4">
              <div className={`text-7xl font-bold mb-3 ${getScoreColor(averageScore)}`}>{averageScore}%</div>
              <p className="text-muted-foreground capitalize text-lg">{performance.replace('_', ' ')}</p>
            </div>
            <div className="mt-6 pt-6 border-t border-border/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Questions Answered</span>
                <span className="font-semibold">{session.questions.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Difficulty</span>
                <span className="font-semibold capitalize">{session.difficulty}</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="bg-card border border-border/50 p-6 rounded-2xl shadow-xl">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-purple-400" /> Question Breakdown</h3>
            <div className="space-y-4">
              {session.questions.map((question, index) => (
                <div key={question.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-sm font-bold text-blue-400">Q{index + 1}</span>
                    <span className="text-sm text-muted-foreground max-w-[150px] truncate">{question.category}</span>
                  </div>
                  <span className={`font-bold text-lg ${getScoreColor(session.scores[index])}`}>{session.scores[index]}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }} className="bg-card border border-border/50 p-6 rounded-2xl shadow-xl">
          <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><Bot className="w-5 h-5 text-green-400" /> Detailed Feedback</h3>
          <div className="space-y-6">
            {session.questions.map((question, index) => (
              <div key={question.id} className="border border-border/50 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center text-sm font-bold text-blue-400">Q{index + 1}</span>
                    <h4 className="font-semibold">{question.category}</h4>
                  </div>
                  <span className={`font-bold text-lg ${getScoreColor(session.scores[index])}`}>{session.scores[index]}%</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{question.text}</p>
                <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg">{session.feedbacks[index]}</p>
                {session.suggestions[index].length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <p className="text-xs font-semibold text-blue-400 mb-2">Suggestions:</p>
                    <ul className="space-y-1">
                      {session.suggestions[index].map((suggestion, suggestionIndex) => (
                        <li key={suggestionIndex} className="text-sm text-muted-foreground flex items-start gap-2"><Zap className="w-3 h-3 text-blue-400 mt-1 flex-shrink-0" />{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-4">
          <button type="button" onClick={restartInterview} className="flex-1 py-4 bg-muted text-foreground rounded-xl font-semibold hover:bg-muted/80 transition-colors flex items-center justify-center gap-2"><RotateCcw className="w-5 h-5" /> Take Another Interview</button>
          <button type="button" onClick={() => setPhase('review')} className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg"><Activity className="w-5 h-5" /> View Full Summary</button>
        </div>
      </div>
    );
  }

  if (phase === 'review' && session) {
    const summary = generateInterviewSummary({ role: session.role, difficulty: session.difficulty, questions: session.questions, scores: session.scores, feedbacks: session.feedbacks });

    return (
      <div className="space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-3 text-foreground">Interview Review</h1>
          <p className="text-muted-foreground text-lg">Complete analysis of your performance</p>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border/50 p-8 rounded-2xl shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border/50">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">{session.role}</h2>
              <p className="text-sm text-muted-foreground capitalize">{session.difficulty} Level • {session.questions.length} Questions</p>
            </div>
          </div>
          <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80 font-mono bg-muted/30 p-4 rounded-xl">{summary}</pre>
        </motion.div>

        <div className="flex gap-4">
          <button type="button" onClick={restartInterview} className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg"><RotateCcw className="w-5 h-5" /> Start New Interview</button>
        </div>
      </div>
    );
  }

  return null;
}
