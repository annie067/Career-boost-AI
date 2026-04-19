import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link as LinkIcon, Save, Loader2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PortfolioData {
  id: string;
  slug?: string;
  name: string;
  bio: string;
  skills: string;
  education?: string;
  projects: Array<{
    title: string;
    description: string;
    link?: string;
  }>;
  socialLinks: {
    github?: string;
    linkedin?: string;
    website?: string;
  };
}

export default function PortfolioBuilder() {
  const { token, user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    skills: '',
    education: '',
    projects: [{ title: '', description: '', link: '' }]
  });

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await fetch('/api/portfolios', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data && !data.error) {
          setPortfolio(data);
          setFormData({
            name: data.name || '',
            bio: data.bio || '',
            skills: data.skills || '',
            education: data.education || '',
            projects: data.projects?.length ? data.projects : [{ title: '', description: '', link: '' }]
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchPortfolio();
  }, [token]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const method = portfolio?.id ? 'PUT' : 'POST';
      const slug = portfolio?.slug || user?.email?.split('@')[0] + '-' + Math.floor(Math.random() * 1000);
      
      const res = await fetch('/api/portfolios', {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...formData, slug, id: portfolio?.id })
      });
      const data = await res.json();
      if (!data.error) setPortfolio(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addProject = () => setFormData({ ...formData, projects: [...formData.projects, { title: '', description: '', link: '' }] });
  
  const updateProject = (index: number, field: string, value: string) => {
    const newProjects = [...formData.projects];
    newProjects[index] = { ...newProjects[index], [field]: value };
    setFormData({ ...formData, projects: newProjects });
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Builder</h1>
          <p className="text-muted-foreground mt-2">Generate a clean, professional webpage instantly.</p>
        </div>
        {portfolio?.slug && (
          <Link to={`/p/${portfolio.slug}`} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80">
            <ExternalLink className="w-4 h-4" /> View Live
          </Link>
        )}
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Skills (comma separated)</label>
            <input type="text" value={formData.skills} onChange={e => setFormData({...formData, skills: e.target.value})} placeholder="React, Node.js, TypeScript" className="w-full p-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Professional Bio</label>
          <textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} rows={3} className="w-full p-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary resize-none" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Education</label>
          <input type="text" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} placeholder="B.S. Computer Science, University X" className="w-full p-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div className="pt-6 border-t border-border">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <h3 className="text-lg font-bold">Projects</h3>
            <button onClick={addProject} className="text-sm text-primary hover:underline">+ Add Project</button>
          </div>
          
          <div className="space-y-6">
            {formData.projects.map((proj, i) => (
              <div key={i} className="p-4 bg-muted/50 rounded-xl space-y-4 border border-border">
                <input type="text" placeholder="Project Title" value={proj.title} onChange={e => updateProject(i, 'title', e.target.value)} className="w-full p-2 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                <textarea placeholder="Description" value={proj.description} onChange={e => updateProject(i, 'description', e.target.value)} rows={2} className="w-full p-2 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary resize-none" />
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-muted-foreground" />
                  <input type="text" placeholder="URL (optional)" value={proj.link} onChange={e => updateProject(i, 'link', e.target.value)} className="flex-1 p-2 bg-background border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save & Publish
          </button>
        </div>
      </div>
    </div>
  );
}
