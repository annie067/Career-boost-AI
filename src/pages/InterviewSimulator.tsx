import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mic, Send, Bot, Loader2, Target, Zap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function InterviewSimulator() {
  const { token } = useAuth();
  const [role, setRole] = useState('Software Engineer');
  const [difficulty, setDifficulty] = useState('Medium');
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [currentQIndex, setCurrentQIndex] = useState(0);

  const startInterview = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role, difficulty })
      });
      const data = await res.json();
      setInterview(data);
      setCurrentQIndex(0);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const newAnswers = [...(interview.answers || [])];
      newAnswers[currentQIndex] = answer;
      const isFinished = currentQIndex === interview.questions.length - 1;
      
      const res = await fetch('/api/interviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: interview.id, answers: newAnswers, isFinished })
      });
      const data = await res.json();
      setInterview(data);
      setAnswer('');
      if (!isFinished) setCurrentQIndex(currentQIndex + 1);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const renderFeedback = () => {
    if (!interview.feedback) return null;
    let fb;
    try { fb = JSON.parse(interview.feedback); } catch { return <p>{interview.feedback}</p>; }
    
    return (
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-blue-500 flex items-center gap-1"><Target className="w-4 h-4"/> Clarity</span>
            <span className="font-bold">{fb.clarity?.score}%</span>
          </div>
          <p className="text-xs text-muted-foreground">{fb.clarity?.text}</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-purple-500 flex items-center gap-1"><Zap className="w-4 h-4"/> Confidence</span>
            <span className="font-bold">{fb.confidence?.score}%</span>
          </div>
          <p className="text-xs text-muted-foreground">{fb.confidence?.text}</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="font-bold text-orange-500 flex items-center gap-1"><Activity className="w-4 h-4"/> Technical</span>
            <span className="font-bold">{fb.technical?.score}%</span>
          </div>
          <p className="text-xs text-muted-foreground">{fb.technical?.text}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">AI Mock Interviews</h1>
        <p className="text-muted-foreground mt-2">Practice with our advanced AI. Get scored on clarity, confidence, and technical accuracy.</p>
      </div>

      {!interview ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-8 rounded-2xl max-w-xl mx-auto text-center space-y-6 border-t-4 border-t-primary">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <Mic className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Configure Interview</h2>
          
          <div className="space-y-4 text-left">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Role</label>
              <input type="text" value={role} onChange={e => setRole(e.target.value)} className="w-full p-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty Level</label>
              <div className="flex gap-2 p-1 bg-muted rounded-xl">
                {['Easy', 'Medium', 'Hard'].map(d => (
                  <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${difficulty === d ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <button onClick={startInterview} disabled={loading} className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold text-lg hover:bg-primary/90 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Start Simulation'}
          </button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">
          {interview.score !== null ? (
            <div className="glass-panel p-8 rounded-2xl text-center space-y-6">
              <h2 className="text-3xl font-bold">Interview Complete!</h2>
              <div className="relative w-40 h-40 mx-auto">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="10" className="text-muted opacity-20" />
                  <circle cx="80" cy="80" r="70" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="439.8" strokeDashoffset={439.8 - (439.8 * interview.score) / 100} className="text-primary transition-all duration-1000 ease-out" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black">{interview.score}</span>
                  <span className="text-xs text-muted-foreground font-bold">OVERALL</span>
                </div>
              </div>
              
              {renderFeedback()}
              
              <div className="pt-6">
                <button onClick={() => setInterview(null)} className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90">Start New Interview</button>
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-[calc(100vh-16rem)] min-h-[500px] shadow-2xl border-primary/20">
              <div className="p-4 bg-muted/50 border-b border-border flex justify-between items-center backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-bold text-sm">Question {currentQIndex + 1} of {interview.questions.length}</span>
                </div>
                <span className="text-xs font-medium px-3 py-1 bg-background rounded-full border border-border">{interview.role}</span>
              </div>
              
              <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-background/50">
                <div className="flex gap-4 max-w-3xl">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 shadow-sm">
                    <Bot className="w-5 h-5 text-primary" />
                  </div>
                  <div className="bg-card border border-border p-5 rounded-2xl rounded-tl-none shadow-sm">
                    <p className="text-foreground text-lg leading-relaxed">{interview.questions[currentQIndex]}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border bg-card">
                <div className="relative max-w-4xl mx-auto">
                  <textarea
                    value={answer}
                    onChange={e => setAnswer(e.target.value)}
                    placeholder="Type your response here using the STAR method..."
                    rows={4}
                    className="w-full p-4 pr-16 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none shadow-inner"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitAnswer(); } }}
                  />
                  <button 
                    onClick={submitAnswer}
                    disabled={loading || !answer.trim()}
                    className="absolute bottom-4 right-4 p-3 bg-primary text-primary-foreground rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors shadow-md"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
