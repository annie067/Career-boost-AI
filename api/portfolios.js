import supabase from './_supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    if (req.method === 'GET') {
      // Public route for viewing portfolio
      if (req.query.slug) {
        const { data, error } = await supabase.from('portfolios').select('*').eq('slug', req.query.slug).single();
        if (error || !data) return res.status(404).json({ error: 'Not found' });
        return res.status(200).json(data);
      }

      // Protected route for editing
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

      const { data, error } = await supabase.from('portfolios').select('*').eq('user_id', user.id).single();
      return res.status(200).json(data || {});
    }

    // Auth required for POST/PUT
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) return res.status(401).json({ error: 'Invalid token' });

    if (req.method === 'POST') {
      const { name, bio, skills, education, projects, slug } = req.body;
      const { data, error } = await supabase.from('portfolios').insert({
        user_id: user.id, slug, name, bio, skills, education, projects
      }).select().single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'PUT') {
      const { id, name, bio, skills, education, projects } = req.body;
      const { data, error } = await supabase.from('portfolios').update({
        name, bio, skills, education, projects
      }).eq('id', id).eq('user_id', user.id).select().single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
