import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FileText, Mic, TrendingUp, ArrowRight, Award, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardData {
  resumes: number;
  interviews: number;
  applications: number;
  profile_completion: number;
  timeline?: TimelineItem[];
}

interface TimelineItem {
  type: 'resume' | 'interview';
  title: string;
  score: number;
  date: string;
}

export default function Dashboard() {
  const { token, user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchStats();
  }, [token]);

  if (loading) return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 bg-muted rounded-lg w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-muted rounded-2xl"></div>)}
      </div>
      <div className="h-64 bg-muted rounded-2xl"></div>
    </div>
  );

  const stats = data?.stats || { resumes: 0, avgScore: 0, interviews: 0, avgInterviewScore: 0 };
  const timeline = data?.timeline || [];
  const trendData = data?.trendData || [];

  const cards = [
    { title: 'Resume ATS Score', value: stats.avgScore ? `${stats.avgScore}%` : 'N/A', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', link: '/resume' },
    { title: 'Interview Score', value: stats.avgInterviewScore ? `${stats.avgInterviewScore}/100` : 'N/A', icon: Mic, color: 'text-green-500', bg: 'bg-green-500/10', link: '/interview' },
    { title: 'Current Level', value: `Lvl ${data?.level || 1}`, icon: Award, color: 'text-purple-500', bg: 'bg-purple-500/10', link: '/roadmap' },
    { title: 'Total XP', value: data?.xp || 0, icon: TrendingUp, color: 'text-orange-500', bg: 'bg-orange-500/10', link: '/' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user?.email?.split('@')[0]}! 👋</h1>
          <p className="text-muted-foreground mt-2">Here's your career progress overview.</p>
        </div>
        <div className="px-4 py-2 bg-primary/10 text-primary rounded-full font-bold text-sm flex items-center gap-2 w-fit">
          <Award className="w-4 h-4" /> Level {data?.level || 1} ({data?.xp || 0} XP)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <Link key={i} to={card.link} className="glass-panel p-6 rounded-2xl hover:-translate-y-1 transition-transform group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -z-10" />
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${card.bg}`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <h3 className="text-muted-foreground text-sm font-medium">{card.title}</h3>
              <div className="flex items-end justify-between mt-2">
                <span className="text-3xl font-bold text-foreground">{card.value}</span>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <h3 className="text-xl font-bold mb-6">ATS Score Trend</h3>
          {trendData.length > 1 ? (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.2} />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--color-primary)' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="var(--color-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--color-primary)' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
              <FileText className="w-8 h-8 mb-2 opacity-50" />
              <p>Analyze more resumes to see your trend.</p>
            </div>
          )}
        </div>

        <div className="glass-panel p-6 rounded-2xl flex flex-col">
          <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {timeline.length > 0 ? timeline.map((item: TimelineItem, i: number) => (
              <div key={i} className="flex gap-4 relative">
                {i !== timeline.length - 1 && <div className="absolute left-[11px] top-8 bottom-[-24px] w-px bg-border" />}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 z-10 ${item.type === 'resume' ? 'bg-blue-500/20 text-blue-500' : 'bg-green-500/20 text-green-500'}`}>
                  {item.type === 'resume' ? <FileText className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
                </div>
                <div>
                  <p className="text-sm font-medium">{item.type === 'resume' ? 'Analyzed Resume' : 'Mock Interview'}</p>
                  <p className="text-xs text-muted-foreground mb-1">{item.title}</p>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className={item.score >= 80 ? 'text-green-500' : 'text-yellow-500'}>Score: {item.score}</span>
                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-center text-muted-foreground py-8">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
