import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, Briefcase, Mail } from 'lucide-react';

interface Project {
  title: string;
  description: string;
  link?: string;
}

interface PortfolioData {
  name: string;
  bio: string;
  skills: string[];
  projects: Project[];
  socialLinks: {
    email?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
  error?: string;
}

export default function PortfolioView() {
  const { slug } = useParams();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      if (!slug) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/portfolios?slug=${encodeURIComponent(slug)}`);
        if (response.ok) {
          const result = (await response.json()) as PortfolioData;
          setData(result);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error(error);
      }

      const local = localStorage.getItem(`public_portfolio_${slug}`);
      if (local) {
        setData(JSON.parse(local) as PortfolioData);
      } else {
        setData({
          name: '',
          bio: '',
          skills: [],
          projects: [],
          socialLinks: {},
          error: 'Portfolio not found',
        });
      }

      setLoading(false);
    };

    void fetchPortfolio();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!data || data.error) return <div className="min-h-screen flex items-center justify-center text-xl">Portfolio not found</div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-20 space-y-14">
        <header className="space-y-5">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-500 rounded-full flex items-center justify-center text-4xl font-bold text-white">
            {data.name?.charAt(0) || 'P'}
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-3">{data.name}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">{data.bio}</p>
          </div>
        </header>

        {data.skills.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold border-b border-border pb-2">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill) => (
                <span key={skill} className="rounded-full bg-secondary px-3 py-1 text-sm">{skill}</span>
              ))}
            </div>
          </section>
        )}

        {data.projects.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold border-b border-border pb-2">Projects</h2>
            <div className="grid gap-4">
              {data.projects.map((project) => (
                <div key={project.title} className="rounded-2xl border border-border p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{project.title}</h3>
                    {project.link && (
                      <a href={project.link} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1 text-sm">
                        Visit <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{project.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-2xl font-semibold border-b border-border pb-2">Contact</h2>
          <div className="text-sm space-y-2 text-muted-foreground">
            {data.socialLinks.email && <p className="inline-flex items-center gap-2"><Mail className="h-4 w-4" />{data.socialLinks.email}</p>}
            {data.socialLinks.github && <p><a href={data.socialLinks.github} target="_blank" rel="noreferrer" className="text-primary hover:underline">GitHub</a></p>}
            {data.socialLinks.linkedin && <p><a href={data.socialLinks.linkedin} target="_blank" rel="noreferrer" className="text-primary hover:underline">LinkedIn</a></p>}
            {data.socialLinks.website && <p><a href={data.socialLinks.website} target="_blank" rel="noreferrer" className="text-primary hover:underline">Website</a></p>}
          </div>
        </section>

        <footer className="pt-8 border-t border-border text-sm text-muted-foreground inline-flex items-center gap-2">
          <Briefcase className="h-4 w-4" /> Built with Career Boost AI
        </footer>
      </div>
    </div>
  );
}
