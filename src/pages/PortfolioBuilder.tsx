import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Loader2, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../lib/database';

interface PortfolioProject {
  title: string;
  description: string;
  link?: string;
}

interface PortfolioData {
  id?: string;
  slug: string;
  name: string;
  bio: string;
  skills: string[];
  projects: PortfolioProject[];
  socialLinks: {
    email: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
}

interface PortfolioForm {
  name: string;
  bio: string;
  skills: string;
  email: string;
  github: string;
  linkedin: string;
  website: string;
  projects: PortfolioProject[];
}

function localPortfolioKey(userId: string): string {
  return `portfolio_${userId}`;
}

function publicPortfolioKey(slug: string): string {
  return `public_portfolio_${slug}`;
}

function toForm(data: PortfolioData): PortfolioForm {
  return {
    name: data.name,
    bio: data.bio,
    skills: data.skills.join(', '),
    email: data.socialLinks.email,
    github: data.socialLinks.github ?? '',
    linkedin: data.socialLinks.linkedin ?? '',
    website: data.socialLinks.website ?? '',
    projects: data.projects.length ? data.projects : [{ title: '', description: '', link: '' }],
  };
}

function fromForm(form: PortfolioForm, slug: string, existingId?: string): PortfolioData {
  return {
    id: existingId,
    slug,
    name: form.name.trim(),
    bio: form.bio.trim(),
    skills: form.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
    projects: form.projects.filter((project) => project.title.trim() && project.description.trim()),
    socialLinks: {
      email: form.email.trim(),
      github: form.github.trim() || undefined,
      linkedin: form.linkedin.trim() || undefined,
      website: form.website.trim() || undefined,
    },
  };
}

export default function PortfolioBuilder() {
  const { user, token } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedPortfolio, setSavedPortfolio] = useState<PortfolioData | null>(null);

  const [form, setForm] = useState<PortfolioForm>({
    name: '',
    bio: '',
    skills: '',
    email: '',
    github: '',
    linkedin: '',
    website: '',
    projects: [{ title: '', description: '', link: '' }],
  });

  useEffect(() => {
    const loadPortfolio = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(user.id);
        const fallbackSlug = `${(user.email ?? 'user').split('@')[0]}-${user.id.slice(0, 6)}`.toLowerCase();

        const localRaw = localStorage.getItem(localPortfolioKey(user.id));
        let localPortfolio: PortfolioData | null = null;
        if (localRaw) {
          localPortfolio = JSON.parse(localRaw) as PortfolioData;
        }

        let remotePortfolio: PortfolioData | null = null;
        if (token) {
          const response = await fetch('/api/portfolios', { headers: { Authorization: `Bearer ${token}` } });
          if (response.ok) {
            const payload = (await response.json()) as Partial<PortfolioData>;
            if (payload?.slug) {
              remotePortfolio = {
                id: payload.id,
                slug: payload.slug,
                name: payload.name ?? '',
                bio: payload.bio ?? '',
                skills: payload.skills ?? [],
                projects: payload.projects ?? [],
                socialLinks: {
                  email: payload.socialLinks?.email ?? user.email ?? '',
                  github: payload.socialLinks?.github,
                  linkedin: payload.socialLinks?.linkedin,
                  website: payload.socialLinks?.website,
                },
              };
            }
          }
        }

        const initialPortfolio = remotePortfolio ?? localPortfolio ?? {
          slug: fallbackSlug,
          name: '',
          bio: '',
          skills: profile?.skills ?? [],
          projects: [{ title: '', description: '', link: '' }],
          socialLinks: { email: user.email ?? '' },
        };

        setSavedPortfolio(initialPortfolio);
        setForm(toForm(initialPortfolio));
      } catch (loadError) {
        console.error(loadError);
        setError('Failed to load portfolio data.');
      } finally {
        setLoading(false);
      }
    };

    void loadPortfolio();
  }, [token, user]);

  const isValid = useMemo(() => {
    return form.name.trim().length > 1 && form.bio.trim().length > 10 && form.email.trim().length > 3;
  }, [form.bio, form.email, form.name]);

  const updateProject = (index: number, field: keyof PortfolioProject, value: string) => {
    setForm((prev) => {
      const projects = [...prev.projects];
      projects[index] = { ...projects[index], [field]: value };
      return { ...prev, projects };
    });
  };

  const addProject = () => {
    setForm((prev) => ({ ...prev, projects: [...prev.projects, { title: '', description: '', link: '' }] }));
  };

  const savePortfolio = async () => {
    if (!user || !savedPortfolio) return;

    setSaving(true);
    setError(null);

    try {
      const portfolioToSave = fromForm(form, savedPortfolio.slug, savedPortfolio.id);

      if (token) {
        const endpoint = '/api/portfolios';
        const method = portfolioToSave.id ? 'PUT' : 'POST';
        const payload = method === 'PUT'
          ? { ...portfolioToSave, id: portfolioToSave.id }
          : portfolioToSave;

        const response = await fetch(endpoint, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error('Failed to save portfolio to server.');
        }

        const stored = (await response.json()) as PortfolioData;
        const normalizedStored: PortfolioData = {
          id: stored.id,
          slug: stored.slug,
          name: stored.name,
          bio: stored.bio,
          skills: stored.skills,
          projects: stored.projects,
          socialLinks: {
            email: stored.socialLinks?.email ?? portfolioToSave.socialLinks.email,
            github: stored.socialLinks?.github,
            linkedin: stored.socialLinks?.linkedin,
            website: stored.socialLinks?.website,
          },
        };
        setSavedPortfolio(normalizedStored);
        localStorage.setItem(localPortfolioKey(user.id), JSON.stringify(normalizedStored));
        localStorage.setItem(publicPortfolioKey(normalizedStored.slug), JSON.stringify(normalizedStored));
        return;
      }

      setSavedPortfolio(portfolioToSave);
      localStorage.setItem(localPortfolioKey(user.id), JSON.stringify(portfolioToSave));
      localStorage.setItem(publicPortfolioKey(portfolioToSave.slug), JSON.stringify(portfolioToSave));
    } catch (saveError) {
      console.error(saveError);
      setError(saveError instanceof Error ? saveError.message : 'Failed to save portfolio.');
    } finally {
      setSaving(false);
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
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Builder</h1>
          <p className="text-muted-foreground mt-1">Create and publish a dynamic portfolio with About, Skills, Projects, and Contact sections.</p>
        </div>
        {savedPortfolio?.slug && (
          <Link to={`/p/${savedPortfolio.slug}`} target="_blank" className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80">
            <ExternalLink className="h-4 w-4" />
            View Live
          </Link>
        )}
      </div>

      <div className="glass-panel rounded-2xl p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium">Name</label>
            <input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} className="mt-1 w-full rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium">Skills (comma separated)</label>
            <input value={form.skills} onChange={(event) => setForm((prev) => ({ ...prev, skills: event.target.value }))} className="mt-1 w-full rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">About</label>
          <textarea value={form.bio} onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))} className="mt-1 h-28 w-full resize-none rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary" />
        </div>

        <div>
          <h2 className="font-semibold mb-3">Contact</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <input placeholder="Email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} className="rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary" />
            <input placeholder="GitHub URL" value={form.github} onChange={(event) => setForm((prev) => ({ ...prev, github: event.target.value }))} className="rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary" />
            <input placeholder="LinkedIn URL" value={form.linkedin} onChange={(event) => setForm((prev) => ({ ...prev, linkedin: event.target.value }))} className="rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary" />
            <input placeholder="Website URL" value={form.website} onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))} className="rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Projects</h2>
            <button type="button" onClick={addProject} className="text-sm text-primary hover:underline">+ Add Project</button>
          </div>

          {form.projects.map((project, index) => (
            <div key={`project-${index}`} className="rounded-xl border border-border p-4 space-y-3">
              <input placeholder="Project title" value={project.title} onChange={(event) => updateProject(index, 'title', event.target.value)} className="w-full rounded-lg border border-border bg-background p-2 outline-none focus:ring-2 focus:ring-primary" />
              <textarea placeholder="Project description" value={project.description} onChange={(event) => updateProject(index, 'description', event.target.value)} className="h-20 w-full resize-none rounded-lg border border-border bg-background p-2 outline-none focus:ring-2 focus:ring-primary" />
              <input placeholder="Project link (optional)" value={project.link ?? ''} onChange={(event) => updateProject(index, 'link', event.target.value)} className="w-full rounded-lg border border-border bg-background p-2 outline-none focus:ring-2 focus:ring-primary" />
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-300">{error}</p>}

        <button type="button" disabled={!isValid || saving} onClick={savePortfolio} className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 inline-flex items-center justify-center gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Portfolio
        </button>
      </div>
    </div>
  );
}
