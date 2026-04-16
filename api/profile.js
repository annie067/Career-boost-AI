import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

    if (req.method === 'GET') {
      let { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (!profile) {
        const { data: newProfile } = await supabase.from('profiles').insert({ id: user.id, full_name: user.email.split('@')[0] }).select().single();
        profile = newProfile;
      }

      let { data: stats } = await supabase.from('user_stats').select('*').eq('user_id', user.id).single();
      if (!stats) {
        const { data: newStats } = await supabase.from('user_stats').insert({ user_id: user.id, xp: 0, level: 1 }).select().single();
        stats = newStats;
      }

      // Calculate level based on XP (every 100 XP = 1 level)
      const currentLevel = Math.floor((stats?.xp || 0) / 100) + 1;

      const { data: resumes } = await supabase.from('resumes').select('id, ats_score, created_at, title').eq('user_id', user.id).order('created_at', { ascending: false });
      const { data: interviews } = await supabase.from('interviews').select('id, score, created_at, role').eq('user_id', user.id).not('score', 'is', null).order('created_at', { ascending: false });

      const avgScore = resumes?.length ? Math.round(resumes.reduce((a,b) => a + b.ats_score, 0) / resumes.length) : 0;
      const avgInterviewScore = interviews?.length ? Math.round(interviews.reduce((a,b) => a + b.score, 0) / interviews.length) : 0;

      // Build timeline
      let timeline = [
        ...(resumes || []).map(r => ({ type: 'resume', title: r.title, date: r.created_at, score: r.ats_score })),
        ...(interviews || []).map(i => ({ type: 'interview', title: i.role, date: i.created_at, score: i.score }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

      // Trend data for charts
      const trendData = (resumes || []).slice(0, 10).reverse().map((r, i) => ({ name: `R${i+1}`, score: r.ats_score }));

      return res.status(200).json({
        ...profile,
        xp: stats?.xp || 0,
        level: currentLevel,
        stats: {
          resumes: resumes?.length || 0,
          avgScore,
          interviews: interviews?.length || 0,
          avgInterviewScore
        },
        timeline,
        trendData
      });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
