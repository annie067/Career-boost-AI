import { useState } from 'react';
import { Search, MapPin, Building, ExternalLink, Loader2, FileText, Plus, X, CheckCircle, XCircle } from 'lucide-react';
import { matchJobs, extractSkillsFromResume, generateSkillSuggestions, MatchResult } from '../lib/jobMatcher';
import { sampleJobs } from '../lib/jobsData';

export default function JobMatcher() {
  const [resumeText, setResumeText] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [matchedJobs, setMatchedJobs] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const roles = [
    'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
    'Data Analyst', 'DevOps Engineer', 'Mobile Developer', 'ML Engineer',
    'UI/UX Developer', 'QA Engineer', 'Product Manager'
  ];

  const addSkill = () => {
    if (skillInput.trim() && !selectedSkills.includes(skillInput.trim())) {
      setSelectedSkills([...selectedSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSkill();
    }
  };

  const analyzeResume = async () => {
    if (!resumeText.trim() && selectedSkills.length === 0) {
      alert('Please enter resume text or select skills');
      return;
    }

    setLoading(true);
    setAnalyzed(false);

    try {
      // Extract skills from resume or use selected skills
      let userSkills = selectedSkills;
      if (resumeText.trim()) {
        userSkills = Array.from(new Set([...userSkills, ...extractSkillsFromResume(resumeText)]));
      }

      // Filter jobs by role if selected
      let filteredJobs = sampleJobs;
      if (selectedRole) {
        filteredJobs = sampleJobs.filter(job =>
          job.title.toLowerCase().includes(selectedRole.toLowerCase()) ||
          job.description.toLowerCase().includes(selectedRole.toLowerCase())
        );
      }

      // Match jobs
      const results = matchJobs(userSkills, filteredJobs);

      setMatchedJobs(results);

      // Generate suggestions based on top match
      if (results.length > 0) {
        const topJob = results[0].job;
        const suggestions = generateSkillSuggestions(userSkills, topJob.required_skills);
        setSuggestions(suggestions);
      }

      setAnalyzed(true);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      alert('Error analyzing resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Job & Internship Matcher</h1>
        <p className="text-muted-foreground mt-2">Find roles that perfectly match your skills and experience.</p>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Paste Your Resume (Optional)</label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here... We'll extract skills automatically"
              className="w-full h-32 p-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Select Skills (Optional)</label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add a skill (e.g., React, Python)"
                className="flex-1 p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
              />
              <button
                onClick={addSkill}
                className="px-4 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            {selectedSkills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                    {skill}
                    <button onClick={() => removeSkill(skill)} className="hover:bg-primary/20 rounded-full p-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Preferred Role (Optional)</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="">Any Role</option>
              {roles.map((role) => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={analyzeResume}
          disabled={loading}
          className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Analyze & Match Jobs
            </>
          )}
        </button>
      </div>

      {analyzed && suggestions.length > 0 && (
        <div className="glass-panel p-4 rounded-2xl border border-blue-500/30 bg-blue-500/10">
          <h3 className="font-bold mb-2 text-blue-200">💡 Skill Improvement Suggestions</h3>
          <ul className="text-sm text-blue-100 space-y-1">
            {suggestions.map((suggestion, i) => (
              <li key={i}>• {suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {analyzed && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Top Job Matches</h2>

          {matchedJobs.length === 0 ? (
            <div className="text-center py-20 glass-panel rounded-2xl border-dashed">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No matches found</h3>
              <p className="text-muted-foreground">
                Try adjusting your skills or role preferences to find more matches.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {matchedJobs.map((result) => (
                <div key={result.job.id} className="glass-panel p-6 rounded-2xl flex flex-col h-full hover:border-primary/50 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-primary/10 text-primary px-3 py-1 rounded-bl-xl font-bold text-sm border-b border-l border-primary/10">
                    {result.score}% Match
                  </div>

                  <div className="flex justify-between items-start mb-4 pr-16">
                    <div>
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{result.job.title}</h3>
                      <div className="flex items-center gap-2 text-muted-foreground mt-1 text-sm">
                        <Building className="w-4 h-4" /> {result.job.company}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                    {result.job.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {result.job.location}</span>}
                    {result.job.type && <span className="px-2 py-0.5 bg-muted rounded text-xs font-medium border border-border">{result.job.type}</span>}
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1 leading-relaxed">
                    {result.job.description}
                  </p>

                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Skills Match:</div>
                    <div className="flex flex-wrap gap-2">
                      {result.matchedSkills.map((skill) => (
                        <span key={skill} className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-400 rounded-md text-xs border border-green-500/20">
                          <CheckCircle className="w-3 h-3" />
                          {skill}
                        </span>
                      ))}
                      {result.missingSkills.map((skill) => (
                        <span key={skill} className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-400 rounded-md text-xs border border-red-500/20">
                          <XCircle className="w-3 h-3" />
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 mt-auto">
                    <a
                      href={result.job.url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                    >
                      Apply Now <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
