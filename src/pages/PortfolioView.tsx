import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, Mail, MapPin, Briefcase } from 'lucide-react';

export default function PortfolioView() {
  const { slug } = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const res = await fetch(`/api/portfolios?slug=${slug}`);
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPortfolio();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!data || data.error) return <div className="min-h-screen flex items-center justify-center text-xl">Portfolio not found</div>;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <div className="max-w-3xl mx-auto px-6 py-20 space-y-16">
        
        <header className="space-y-6">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-500 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-xl">
            {data.name?.charAt(0) || 'P'}
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{data.name}</h1>
            <p className="text-xl text-muted-foreground leading-relaxed">{data.bio}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            {data.education && (
              <div className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> {data.education}</div>
            )}
          </div>
        </header>

        {data.skills && (
          <section className="space-y-4">
            <h2 className="text-2xl font-bold border-b border-border pb-2">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {data.skills.split(',').map((skill: string, i: number) => (
                <span key={i} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
                  {skill.trim()}
                </span>
              ))}
            </div>
          </section>
        )}

        {data.projects && data.projects.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-2xl font-bold border-b border-border pb-2">Featured Projects</h2>
            <div className="grid gap-6">
              {data.projects.map((proj: any, i: number) => (
                <div key={i} className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-bold">{proj.title}</h3>
                    {proj.link && (
                      <a href={proj.link} target="_blank" rel="noreferrer" className="p-2 text-muted-foreground hover:text-primary transition-colors">
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                  <p className="text-muted-foreground leading-relaxed">{proj.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <footer className="pt-12 border-t border-border text-center text-muted-foreground text-sm">
          Built with CareerBoost AI
        </footer>
      </div>
    </div>
  );
}
