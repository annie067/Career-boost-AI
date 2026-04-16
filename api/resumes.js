import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('resumes').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { content, title, jobDescription } = req.body;
      
      // Simulated Advanced AI Analysis
      const wordCount = content.split(' ').length;
      const baseScore = Math.min(Math.max(wordCount / 5, 40), 95);
      
      let matchPercentage = null;
      if (jobDescription) {
        // Simulate job matching
        matchPercentage = Math.floor(Math.random() * 40) + 50; // 50-90%
      }

      const ats_score = Math.floor(baseScore + (Math.random() * 10 - 5));
      
      const missing_skills = ['Docker', 'AWS', 'GraphQL', 'System Design', 'Agile'].sort(() => 0.5 - Math.random()).slice(0, 3);
      
      const detailedFeedback = {
        skills_gap: `Missing key terms often found in similar roles: ${missing_skills.join(', ')}.`,
        experience_quality: 'Good use of action verbs, but could quantify results more clearly.',
        formatting: 'Clean and readable, but ensure standard section headers are used for ATS parsing.',
        impact: 'Impact is somewhat visible. Try adding metrics like "Increased efficiency by X%".'
      };

      const { data, error } = await supabase.from('resumes').insert({
        user_id: user.id,
        title,
        content,
        ats_score,
        missing_skills,
        suggestions: Object.values(detailedFeedback) // Keep for backward compatibility or UI
      }).select().single();

      if (error) throw error;

      // Add XP
      await supabase.rpc('increment_xp', { user_id: user.id, amount: 50 }).catch(() => {
        // Fallback if RPC doesn't exist (we will just upsert manually)
        supabase.from('user_stats').select('*').eq('user_id', user.id).single().then(({data: stat}) => {
          if (stat) supabase.from('user_stats').update({ xp: stat.xp + 50 }).eq('user_id', user.id).then();
          else supabase.from('user_stats').insert({ user_id: user.id, xp: 50, level: 1 }).then();
        });
      });

      return res.status(201).json({ ...data, matchPercentage, detailedFeedback });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      const { error } = await supabase.from('resumes').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
