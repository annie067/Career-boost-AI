import { useEffect, useMemo, useState } from 'react';
import { Building, ExternalLink, Loader2, Plus, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { matchJobs, generateSkillSuggestions, type MatchResult } from '../lib/jobMatcher';
import { sampleJobs } from '../lib/jobsData';
import { getUserProfile, mergeUniqueSkills, upsertUserProfile } from '../lib/database';
import { extractSkillsFromText } from '../lib/skills';

const ROLES = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Data Analyst', 'DevOps Engineer'];

export default function JobMatcher() {
  const { user } = useAuth();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resumeText, setResumeText] = useState('');
  const [manualSkillInput, setManualSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState('');

  const [results, setResults] = useState<MatchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setLoadingProfile(false);
        return;
      }

      try {
        const profile = await getUserProfile(user.id);
        if (profile?.skills?.length) setSkills(profile.skills);
        if (profile?.resume_text) setResumeText(profile.resume_text);
      } catch (loadError) {
        console.error(loadError);
        setError('Could not load profile skills.');
      } finally {
        setLoadingProfile(false);
      }
    };

    void loadProfile();
  }, [user]);

  const visibleJobs = useMemo(() => {
    if (!selectedRole) return sampleJobs;
    const roleLower = selectedRole.toLowerCase();
    return sampleJobs.filter((job) => job.title.toLowerCase().includes(roleLower));
  }, [selectedRole]);

  const addSkill = () => {
    const next = manualSkillInput.trim();
    if (!next) return;
    setSkills((prev) => mergeUniqueSkills(prev, [next]));
    setManualSkillInput('');
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills((prev) => prev.filter((skill) => skill.toLowerCase() !== skillToRemove.toLowerCase()));
  };

  const runMatching = async () => {
    if (!user) return;

    setMatching(true);
    setError(null);

    try {
      const extracted = extractSkillsFromText(resumeText);
      const mergedSkills = mergeUniqueSkills(skills, extracted);

      if (mergedSkills.length === 0) {
        throw new Error('Add at least one skill or provide resume text before matching jobs.');
      }

      const matches = matchJobs(mergedSkills, visibleJobs, 10);
      setResults(matches);

      if (matches[0]) {
        setSuggestions(generateSkillSuggestions(mergedSkills, matches[0].job.required_skills));
      }

      const profile = await getUserProfile(user.id);
      await upsertUserProfile({
        user_id: user.id,
        skills: mergeUniqueSkills(profile?.skills ?? [], mergedSkills),
        resume_text: resumeText.trim() || profile?.resume_text || '',
      });

      setSkills(mergedSkills);
    } catch (matchError) {
      console.error(matchError);
      setError(matchError instanceof Error ? matchError.message : 'Failed to match jobs.');
    } finally {
      setMatching(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Job Matcher</h1>
        <p className="text-muted-foreground mt-2">Match your current skills with real role requirements and identify skill gaps.</p>
      </div>

      <div className="glass-panel rounded-2xl p-6 space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium">Resume Text (optional)</label>
          <textarea
            value={resumeText}
            onChange={(event) => setResumeText(event.target.value)}
            className="h-36 w-full resize-none rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary"
            placeholder="Paste resume text to auto-extract skills..."
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Skills</label>
          <div className="flex gap-2">
            <input
              value={manualSkillInput}
              onChange={(event) => setManualSkillInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addSkill();
                }
              }}
              className="flex-1 rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary"
              placeholder="Add a skill (e.g. React, SQL)"
            />
            <button type="button" onClick={addSkill} className="rounded-xl bg-secondary px-4 hover:bg-secondary/80">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {skills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                  {skill}
                  <button type="button" onClick={() => removeSkill(skill)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Preferred Role</label>
          <select
            value={selectedRole}
            onChange={(event) => setSelectedRole(event.target.value)}
            className="w-full rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Roles</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <button
          type="button"
          onClick={runMatching}
          disabled={matching}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {matching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Match Jobs
        </button>
      </div>

      {suggestions.length > 0 && (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
          <h2 className="font-semibold text-blue-200">Suggestions</h2>
          <ul className="mt-2 space-y-1 text-sm text-blue-100">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {results.map((result) => (
          <div key={result.job.id} className="glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{result.job.title}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1"><Building className="h-4 w-4" />{result.job.company}</p>
              </div>
              <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">{result.score}%</span>
            </div>

            <p className="text-sm text-muted-foreground">{result.job.description}</p>

            <div className="space-y-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Matched Skills</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {result.matchedSkills.map((skill) => (
                    <span key={skill} className="rounded bg-green-500/15 px-2 py-1 text-xs text-green-300">{skill}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Missing Skills</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {result.missingSkills.map((skill) => (
                    <span key={skill} className="rounded bg-red-500/15 px-2 py-1 text-xs text-red-300">{skill}</span>
                  ))}
                </div>
              </div>
            </div>

            {result.job.url && (
              <a href={result.job.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                View Role
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
