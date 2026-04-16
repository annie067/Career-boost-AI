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
      const { data, error } = await supabase.from('saved_jobs').select('job_id').eq('user_id', user.id);
      if (error) throw error;
      return res.status(200).json(data.map(d => d.job_id));
    }

    if (req.method === 'POST') {
      const { job_id } = req.body;
      const { data, error } = await supabase.from('saved_jobs').insert({ user_id: user.id, job_id }).select();
      if (error) throw error;
      return res.status(201).json(data);
    }

    if (req.method === 'DELETE') {
      const { job_id } = req.body;
      const { error } = await supabase.from('saved_jobs').delete().eq('user_id', user.id).eq('job_id', job_id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
