import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Building, ExternalLink, Loader2, Bookmark, BookmarkCheck, Filter } from 'lucide-react';

export default function JobMatcher() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [skills, setSkills] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (skills) params.append('skills', skills);
      if (location) params.append('location', location);
      if (type) params.append('type', type);

      const [jobsRes, savedRes] = await Promise.all([
        fetch(`/api/jobs?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/saved_jobs`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const jobsData = await jobsRes.json();
      const savedData = await savedRes.json();
      
      setJobs(jobsData);
      setSavedJobs(savedData);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); fetchData(); };

  const toggleSave = async (jobId: number) => {
    const isSaved = savedJobs.includes(jobId);
    try {
      if (isSaved) {
        await fetch('/api/saved_jobs', { method: 'DELETE', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ job_id: jobId }) });
        setSavedJobs(savedJobs.filter(id => id !== jobId));
      } else {
        await fetch('/api/saved_jobs', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ job_id: jobId }) });
        setSavedJobs([...savedJobs, jobId]);
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Job & Internship Matcher</h1>
        <p className="text-muted-foreground mt-2">Find roles that perfectly match your skills and experience.</p>
      </div>

      <div className="glass-panel p-4 rounded-2xl space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input type="text" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="Skills (e.g. React, Python)" className="w-full pl-12 pr-4 py-3.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" />
          </div>
          <button type="button" onClick={() => setShowFilters(!showFilters)} className="px-4 py-3.5 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80 flex items-center justify-center gap-2 border border-border">
            <Filter className="w-5 h-5" /> Filters
          </button>
          <button type="submit" className="w-full sm:w-auto px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            Search
          </button>
        </form>

        {showFilters && (
          <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border animate-in slide-in-from-top-2">
            <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location (e.g. Remote, New York)" className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none" />
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none appearance-none">
              <option value="">Any Job Type</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Internship">Internship</option>
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-64 bg-muted rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="glass-panel p-6 rounded-2xl flex flex-col h-full hover:border-primary/50 transition-all group relative overflow-hidden">
              {job.match_percentage && (
                <div className="absolute top-0 right-0 bg-primary/10 text-primary px-3 py-1 rounded-bl-xl font-bold text-sm border-b border-l border-primary/10">
                  {job.match_percentage}% Match
                </div>
              )}
              
              <div className="flex justify-between items-start mb-4 pr-16">
                <div>
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{job.title}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground mt-1 text-sm">
                    <Building className="w-4 h-4" /> {job.company}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                <span className="px-2 py-0.5 bg-muted rounded text-xs font-medium border border-border">{job.type}</span>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1 leading-relaxed">
                {job.description}
              </p>

              <div className="mb-6 flex flex-wrap gap-2">
                {job.skills_required?.map((skill: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 bg-secondary/50 text-secondary-foreground rounded-md text-xs font-medium border border-border/50">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="flex gap-3 mt-auto">
                <a href={job.url || '#'} target="_blank" rel="noreferrer" className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm">
                  Apply Now <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => toggleSave(job.id)} className={`p-3 rounded-xl border transition-colors flex items-center justify-center ${savedJobs.includes(job.id) ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}>
                  {savedJobs.includes(job.id) ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                </button>
              </div>
            </div>
          ))}
          {jobs.length === 0 && (
            <div className="col-span-2 text-center py-20 glass-panel rounded-2xl border-dashed">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">No jobs found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
