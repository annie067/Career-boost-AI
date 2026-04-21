import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle, Trash2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
  calculateResumeScore,
  parseJobDescriptionSkills,
  parseResume,
  recommendMissingSkills,
  type ParsedResume,
} from '../lib/resumeParser';
import { getUserProfile, mergeUniqueSkills, upsertUserProfile } from '../lib/database';

interface ResumeAnalysis {
  id: string;
  title: string;
  sourceText: string;
  parsed: ParsedResume;
  atsScore: number;
  missingSkills: string[];
  createdAt: string;
}

function getStorageKey(userId: string): string {
  return `resume_analyses_${userId}`;
}

async function extractTextFromFile(file: File, token: string | null): Promise<string> {
  if (token) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/parse-resume', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (response.ok) {
      const payload = (await response.json()) as { text?: string };
      if (payload.text) return payload.text;
    }
  }

  const fallbackText = await file.text();
  return fallbackText;
}

export default function ResumeAnalyzer() {
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'paste' | 'upload'>('paste');
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [analyses, setAnalyses] = useState<ResumeAnalysis[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const profile = await getUserProfile(user.id);
      if (profile?.resume_text) {
        setResumeText(profile.resume_text);
      }

      const stored = localStorage.getItem(getStorageKey(user.id));
      if (stored) {
        setAnalyses(JSON.parse(stored) as ResumeAnalysis[]);
      }
    } catch (loadError) {
      console.error(loadError);
      setError('Failed to load your resume history.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const latestAnalysis = useMemo(() => analyses[0] ?? null, [analyses]);

  const handleAnalyze = async () => {
    if (!user) return;

    setAnalyzing(true);
    setError(null);

    try {
      let content = '';
      let title = `Resume - ${new Date().toLocaleDateString()}`;

      if (activeTab === 'paste') {
        content = resumeText.trim();
      } else if (file) {
        title = file.name;
        content = (await extractTextFromFile(file, token)).trim();
      }

      if (!content) {
        throw new Error('Please provide resume text or upload a supported file.');
      }

      const parsed = parseResume(content);
      const atsScore = calculateResumeScore(parsed);
      const jdSkills = parseJobDescriptionSkills(jobDescription);
      const missingSkills = recommendMissingSkills(parsed.skills, jdSkills);

      const profile = await getUserProfile(user.id);
      await upsertUserProfile({
        user_id: user.id,
        resume_text: content,
        skills: mergeUniqueSkills(profile?.skills ?? [], parsed.skills),
      });

      const analysis: ResumeAnalysis = {
        id: `analysis-${Date.now()}`,
        title,
        sourceText: content,
        parsed,
        atsScore,
        missingSkills,
        createdAt: new Date().toISOString(),
      };

      const updated = [analysis, ...analyses].slice(0, 20);
      setAnalyses(updated);
      localStorage.setItem(getStorageKey(user.id), JSON.stringify(updated));
      setFile(null);
    } catch (analyzeError) {
      console.error(analyzeError);
      setError(analyzeError instanceof Error ? analyzeError.message : 'Failed to analyze resume.');
    } finally {
      setAnalyzing(false);
    }
  };

  const deleteAnalysis = (id: string) => {
    if (!user) return;
    const updated = analyses.filter((analysis) => analysis.id !== id);
    setAnalyses(updated);
    localStorage.setItem(getStorageKey(user.id), JSON.stringify(updated));
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
        <h1 className="text-3xl font-bold">Resume Analyzer</h1>
        <p className="text-muted-foreground mt-2">Extract skills, evaluate ATS readiness, and identify missing skills for your target role.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <div className="flex gap-2 rounded-xl bg-muted p-1">
            <button type="button" onClick={() => setActiveTab('paste')} className={`flex-1 rounded-lg py-2 text-sm ${activeTab === 'paste' ? 'bg-background font-medium' : 'text-muted-foreground'}`}>
              Paste Text
            </button>
            <button type="button" onClick={() => setActiveTab('upload')} className={`flex-1 rounded-lg py-2 text-sm ${activeTab === 'upload' ? 'bg-background font-medium' : 'text-muted-foreground'}`}>
              Upload File
            </button>
          </div>

          {activeTab === 'paste' ? (
            <textarea
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              className="h-64 w-full resize-none rounded-xl border border-border bg-background p-4 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Paste your resume text here..."
            />
          ) : (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click();
              }}
              className="flex h-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/20 p-6 text-center"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf,.docx"
                className="hidden"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
              <Upload className="mb-3 h-8 w-8 text-primary" />
              <p className="font-medium">Upload TXT, PDF, or DOCX</p>
              <p className="text-xs text-muted-foreground mt-1">{file ? file.name : 'Click to select a file'}</p>
            </div>
          )}

          <textarea
            value={jobDescription}
            onChange={(event) => setJobDescription(event.target.value)}
            className="h-40 w-full resize-none rounded-xl border border-border bg-background p-4 outline-none focus:ring-2 focus:ring-primary"
            placeholder="Paste target job description (optional for gap analysis)..."
          />

          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300 flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={analyzing || (activeTab === 'paste' ? !resumeText.trim() : !file)}
            className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Analyze Resume
          </button>
        </div>

        <div className="glass-panel rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Latest Analysis</h2>
          {!latestAnalysis ? (
            <p className="text-sm text-muted-foreground">No analysis yet.</p>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="font-medium">{latestAnalysis.title}</p>
                <p className="text-sm font-semibold text-primary">ATS {latestAnalysis.atsScore}%</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {latestAnalysis.parsed.skills.map((skill) => (
                    <span key={skill} className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">{skill}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Education Keywords</p>
                <p className="text-sm text-muted-foreground">{latestAnalysis.parsed.education.join(', ') || 'None detected'}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Experience Keywords</p>
                <p className="text-sm text-muted-foreground">{latestAnalysis.parsed.experience.join(', ') || 'None detected'}</p>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Suggestions</p>
                <ul className="space-y-1">
                  {latestAnalysis.parsed.suggestions.map((suggestion) => (
                    <li key={suggestion} className="text-sm text-muted-foreground flex gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>

              {latestAnalysis.missingSkills.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Missing Skills for Job Description</p>
                  <div className="flex flex-wrap gap-2">
                    {latestAnalysis.missingSkills.map((skill) => (
                      <span key={skill} className="rounded-full bg-red-500/10 px-3 py-1 text-xs text-red-300">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">History</h2>
        {analyses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
            <FileText className="mx-auto mb-3 h-8 w-8 opacity-60" />
            No previous analyses.
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((analysis) => (
              <motion.div key={analysis.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-xl p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium">{analysis.title}</p>
                  <p className="text-xs text-muted-foreground">{new Date(analysis.createdAt).toLocaleString()}</p>
                  <p className="text-sm mt-1">ATS Score: <span className="font-semibold">{analysis.atsScore}%</span></p>
                </div>
                <button type="button" onClick={() => deleteAnalysis(analysis.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-red-300">
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
