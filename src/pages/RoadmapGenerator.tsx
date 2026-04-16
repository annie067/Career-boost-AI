import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Map, Target, CheckCircle2, Circle, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RoadmapGenerator() {
  const { token } = useAuth();
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [goal, setGoal] = useState('');

  const fetchRoadmaps = async () => {
    try {
      const res = await fetch('/api/roadmaps', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setRoadmaps(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchRoadmaps(); }, [token]);

  const handleGenerate = async () => {
    if (!goal.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/roadmaps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ goal })
      });
      if (res.ok) {
        setGoal('');
        fetchRoadmaps();
      }
    } catch (err) { console.error(err); } finally { setGenerating(false); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">AI Career Roadmap</h1>
        <p className="text-muted-foreground mt-2">Generate a step-by-step personalized guide to reach your dream role.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl border-t-4 border-t-purple-500">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Target className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              value={goal} 
              onChange={e => setGoal(e.target.value)} 
              placeholder="What is your career goal? (e.g. Senior Frontend Developer at FAANG)" 
              className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" 
            />
          </div>
          <button 
            onClick={handleGenerate} 
            disabled={generating || !goal.trim()} 
            className="w-full sm:w-auto px-8 py-4 bg-purple-500 text-white rounded-xl font-bold hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
          >
            {generating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Map className="w-5 h-5" />}
            Generate Roadmap
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : roadmaps.length === 0 ? (
          <div className="text-center p-12 glass-panel rounded-2xl border-dashed">
            <Map className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">No roadmaps generated yet. Tell us your goal above!</p>
          </div>
        ) : (
          roadmaps.map((rm, i) => (
            <motion.div key={rm.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-panel p-6 md:p-8 rounded-2xl">
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-2"><Target className="w-6 h-6 text-purple-500" /> {rm.goal}</h3>
              <p className="text-sm text-muted-foreground mb-8">Generated on {new Date(rm.created_at).toLocaleDateString()}</p>
              
              <div className="relative border-l-2 border-muted ml-3 md:ml-4 space-y-8 pb-4">
                {rm.steps?.map((step: any, idx: number) => (
                  <div key={idx} className="relative pl-8 md:pl-10">
                    <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full flex items-center justify-center ${step.completed ? 'bg-green-500 text-white' : 'bg-background border-2 border-purple-500 text-background'}`}>
                      {step.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-3 h-3 fill-purple-500" />}
                    </div>
                    <div className="bg-muted/30 p-5 rounded-xl border border-border/50 hover:border-purple-500/30 transition-colors">
                      <h4 className="text-lg font-bold mb-2">Step {idx + 1}: {step.title}</h4>
                      <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
