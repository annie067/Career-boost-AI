import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('roadmaps').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      const { goal, currentSkills } = req.body;
      
      // Simulated AI Roadmap Generation
      const steps = [
        { title: 'Foundation', desc: `Master the basics of ${goal.split(' ')[0] || 'the domain'}.`, completed: false },
        { title: 'Core Projects', desc: 'Build 2-3 portfolio projects demonstrating core competencies.', completed: false },
        { title: 'Advanced Concepts', desc: 'Deep dive into system design and advanced patterns.', completed: false },
        { title: 'Interview Prep', desc: 'Practice mock interviews and LeetCode style questions.', completed: false }
      ];

      const { data, error } = await supabase.from('roadmaps').insert({
        user_id: user.id,
        goal,
        steps
      }).select().single();
      if (error) throw error;
      
      // Add XP
      supabase.from('user_stats').select('*').eq('user_id', user.id).single().then(({data: stat}) => {
        if (stat) supabase.from('user_stats').update({ xp: stat.xp + 20 }).eq('user_id', user.id).then();
        else supabase.from('user_stats').insert({ user_id: user.id, xp: 20, level: 1 }).then();
      });

      return res.status(201).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
