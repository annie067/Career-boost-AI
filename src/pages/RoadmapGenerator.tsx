import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Circle, Loader2, Map, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { generateRoadmap, roadmaps, type RoadmapStep } from '../lib/roadmapData';
import { getUserProfile, getUserProgress, mergeUniqueSkills, upsertUserProgress } from '../lib/database';

interface GeneratedRoadmap {
  id: string;
  goal: string;
  matchPercentage: number;
  missingSkills: string[];
  steps: RoadmapStep[];
  createdAt: string;
}

function storageKey(userId: string): string {
  return `generated_roadmaps_${userId}`;
}

export default function RoadmapGenerator() {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [targetRole, setTargetRole] = useState('Frontend Developer');
  const [skillInput, setSkillInput] = useState('');
  const [userSkills, setUserSkills] = useState<string[]>([]);
  const [completedSkills, setCompletedSkills] = useState<string[]>([]);
  const [generated, setGenerated] = useState<GeneratedRoadmap[]>([]);

  const roleOptions = useMemo(() => Object.keys(roadmaps), []);

  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const [profile, progress] = await Promise.all([
          getUserProfile(user.id),
          getUserProgress(user.id),
        ]);

        setUserSkills(profile?.skills ?? []);
        setCompletedSkills(progress?.completed_skills ?? []);

        const stored = localStorage.getItem(storageKey(user.id));
        if (stored) {
          setGenerated(JSON.parse(stored) as GeneratedRoadmap[]);
        }
      } catch (loadError) {
        console.error(loadError);
        setError('Failed to load roadmap data.');
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [user]);

  const addSkill = () => {
    const value = skillInput.trim();
    if (!value) return;

    setUserSkills((prev) => mergeUniqueSkills(prev, [value]));
    setSkillInput('');
  };

  const removeSkill = (skillToRemove: string) => {
    setUserSkills((prev) => prev.filter((skill) => skill.toLowerCase() !== skillToRemove.toLowerCase()));
  };

  const generate = async () => {
    if (!user) return;

    setGenerating(true);
    setError(null);

    try {
      const roadmap = generateRoadmap(targetRole, userSkills, completedSkills);
      const entry: GeneratedRoadmap = {
        id: `roadmap-${Date.now()}`,
        goal: targetRole,
        matchPercentage: roadmap.matchPercentage,
        missingSkills: roadmap.missingSkills,
        steps: roadmap.steps,
        createdAt: new Date().toISOString(),
      };

      const updated = [entry, ...generated].slice(0, 15);
      setGenerated(updated);
      localStorage.setItem(storageKey(user.id), JSON.stringify(updated));
    } catch (generateError) {
      console.error(generateError);
      setError('Could not generate roadmap.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleStep = async (roadmapId: string, stepIndex: number) => {
    if (!user) return;

    const updatedRoadmaps = generated.map((roadmap) => {
      if (roadmap.id !== roadmapId) return roadmap;
      const steps = roadmap.steps.map((step, index) =>
        index === stepIndex ? { ...step, completed: !step.completed } : step,
      );
      return { ...roadmap, steps };
    });

    setGenerated(updatedRoadmaps);
    localStorage.setItem(storageKey(user.id), JSON.stringify(updatedRoadmaps));

    const newlyCompletedSkills = updatedRoadmaps
      .flatMap((roadmap) => roadmap.steps)
      .filter((step) => step.completed && step.relatedSkill)
      .map((step) => step.relatedSkill as string);

    const mergedCompleted = mergeUniqueSkills(completedSkills, newlyCompletedSkills);
    setCompletedSkills(mergedCompleted);

    try {
      await upsertUserProgress({ user_id: user.id, completed_skills: mergedCompleted });
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Career Roadmap Generator</h1>
        <p className="text-muted-foreground mt-2">Compare your current skills with target role requirements and plan next steps.</p>
      </div>

      <div className="glass-panel rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium mb-2">Target Role</label>
          <select value={targetRole} onChange={(event) => setTargetRole(event.target.value)} className="w-full rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary">
            {roleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Current Skills</label>
          <div className="flex gap-2">
            <input
              value={skillInput}
              onChange={(event) => setSkillInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addSkill();
                }
              }}
              placeholder="Add skill"
              className="flex-1 rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary"
            />
            <button type="button" onClick={addSkill} className="rounded-xl bg-secondary px-4 hover:bg-secondary/80">Add</button>
          </div>

          {userSkills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {userSkills.map((skill) => (
                <button key={skill} type="button" onClick={() => removeSkill(skill)} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary hover:bg-primary/20">
                  {skill} x
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <button type="button" onClick={generate} disabled={generating} className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex justify-center items-center gap-2">
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Map className="h-4 w-4" />}
          Generate Roadmap
        </button>
      </div>

      <div className="space-y-5">
        {generated.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">Generate your first roadmap to get started.</div>
        ) : (
          generated.map((entry, index) => (
            <motion.div key={entry.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="glass-panel rounded-2xl p-6 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold inline-flex items-center gap-2"><Target className="h-5 w-5 text-primary" />{entry.goal}</h2>
                  <p className="text-xs text-muted-foreground mt-1">Generated {new Date(entry.createdAt).toLocaleString()}</p>
                </div>
                <div className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">Match {entry.matchPercentage}%</div>
              </div>

              {entry.missingSkills.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Missing Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {entry.missingSkills.map((skill) => (
                      <span key={skill} className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-300">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {entry.steps.map((step, stepIndex) => (
                  <button key={`${entry.id}-${step.title}`} type="button" onClick={() => void toggleStep(entry.id, stepIndex)} className="w-full rounded-xl border border-border bg-background/40 p-3 text-left hover:border-primary/40">
                    <div className="flex items-start gap-3">
                      {step.completed ? <CheckCircle2 className="h-5 w-5 text-green-400 mt-0.5" /> : <Circle className="h-5 w-5 text-muted-foreground mt-0.5" />}
                      <div>
                        <p className="font-medium">{step.title}</p>
                        <p className="text-sm text-muted-foreground">{step.description}</p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{step.level}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
